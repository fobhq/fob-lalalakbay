(() => {
'use strict';
const C=window.FOB_CONFIG,box=document.getElementById('ll-packages');
const format=n=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(n);
const kit=C.freebieKit||['Bottled water','Button pin','Stickers','Photocard'];
const rides=[
 {id:'bus',vehicle:'bus',name:'Bus',eyebrow:'THE FESTIVAL CREW',description:'A shared coach ride with three package choices—from shuttle only to the full VIP kit.',features:['Coach-style seating','3 package choices','Coordinator support'],photos:['bus-experience-02-blurred.png','bus-experience-01-blurred.png','bus-experience-03-blurred.png'],alts:['Fans inside a previous FOB PH bus trip, faces blurred','Fans beside their FOB PH bus, faces blurred','Passengers on a past FOB PH trip, faces blurred'],photoLabel:'Past FOB PH bus trips'},
 {id:'regular',vehicle:'van',packageId:'normal-van',name:'Regular van',eyebrow:'THE SIMPLE RIDE',description:'A straightforward shared van ride with standard bench-style seating and shuttle-only inclusions.',features:['14-passenger regular van','Shuttle-only package','Coordinator support'],photos:['regular-van-interior.jpg'],alts:['Regular van interior with standard black bench-style seats'],photoLabel:'Regular van interior reference'},
 {id:'vip',vehicle:'van',packageId:'vip-van',name:'VIP van',eyebrow:'THE UPGRADED INTERIOR',description:'An upgraded van interior with individual-style seats, plus the artist-themed freebie kit and LaLaLakbay Eco Bag.',features:['12-passenger VIP van','Fan kit + Eco Bag included','Coordinator support'],photos:['vip-van-experience-02.jpg','vip-van-experience-01.jpg','vip-van-experience-03.jpg','vip-van-experience-04-blurred.png'],alts:['VIP van with cream and black individual-style seats and colorful ceiling lights','VIP van interior with light-colored seats and blue lighting','Another view of the VIP van interior','Passengers inside a VIP van, faces blurred'],photoLabel:'VIP van interior references'}
];
const vanOverview={id:'van',vehicle:'van',name:'Van',eyebrow:'YOUR SMALLER-CREW RIDE',description:'Choose Van to explore Regular Van and VIP Van interiors, packages, and inclusions.',features:['Regular or VIP van options','2 package choices','Coordinator support'],photos:['vip-van-experience-02.jpg','regular-van-interior.jpg','vip-van-experience-01.jpg'],alts:['VIP van interior reference','Regular van interior reference','VIP van interior reference with light-colored seats'],photoLabel:'Regular & VIP van interior references'};
function packagesFor(id){return id==='bus'?C.packages.bus:C.packages.van;}
function renderPackages(id){
 if(!box)return;
 const ride=id==='van'?vanOverview:rides[0],packages=packagesFor(ride.id);
 document.querySelectorAll('[data-ride-card]').forEach(card=>{const active=card.dataset.rideCard===ride.id;card.classList.toggle('selected',active);const button=card.querySelector('[data-ride-select]');if(button)button.setAttribute('aria-pressed',String(active));});
 box.replaceChildren();
 for(const p of packages){
  const card=document.createElement('article');card.className='ll-package'+(p.ecoBag?' package-vip':'')+(p.popular||p.id==='vip-van'?' package-featured':'');
  const packageRide=ride.vehicle==='bus'?'bus':p.id==='normal-van'?'regular van':'VIP van';
  const photo=ride.vehicle==='van'?`<div class="package-interior"><span>${p.id==='normal-van'?'REGULAR VAN · 14 SEATS':'VIP VAN · 12 SEATS'}</span><img src="assets/${p.id==='normal-van'?'regular-van-interior.jpg':'vip-van-experience-01.jpg'}" alt="${p.id==='normal-van'?'Standard regular van bench-style seating':'VIP van interior with upgraded individual-style seats'}" width="800" height="450" loading="lazy"></div>`:'';
  card.innerHTML=`<div class="reference-package-badge">${p.badge?'<span>'+p.badge+'</span>':''}</div>${photo}<span class="ll-package-label">${p.tierLabel}</span><h3>${p.name}</h3><div class="ll-price">${format(p.price)} <small>/ passenger</small></div><ul>${p.inclusions.map(item=>`<li${item==='No freebies included'?' class="not-included"':''}><span aria-hidden="true">${item==='No freebies included'?'—':'+'}</span>${item}</li>`).join('')}</ul><div class="package-pickup"><span>PICKUP</span><strong>${p.pickup}</strong></div><a class="ll-button" href="booking.html?vehicle=${ride.vehicle}&package=${p.id}" aria-label="Select ${p.name} by ${packageRide} for ${format(p.price)} per passenger">Select package</a>${ride.vehicle==='van'?'<p class="package-area-note">Bacoor, Dasma & Rodriguez: '+format(C.pickupRules.vanPriceOverrides['SM Bacoor'][p.id])+'</p>':''}`;
  box.append(card);
 }
 const heading=document.getElementById('package-heading');if(heading)heading.textContent='Choose your '+ride.name.toLowerCase()+' package';
 const eyebrow=document.getElementById('package-mode-eyebrow');if(eyebrow)eyebrow.textContent=ride.name.toUpperCase()+' OPTIONS';
 const result=document.getElementById('package-result-label');if(result)result.textContent=packages.length+' OPTIONS';
 box.classList.toggle('van-package-grid',ride.id==='van');
}
const choices=document.getElementById('ride-choices');
if(choices)[rides[0],vanOverview].forEach(ride=>{
 const packages=packagesFor(ride.id),price=Math.min(...packages.map(p=>p.price));
 const card=document.createElement('article');card.className='ride-choice-card';card.dataset.rideCard=ride.id;
 const photos=ride.photos.map((file,i)=>`<img class="ride-slide${i===0?' active':''}" src="assets/${file}" alt="${ride.alts[i]}" width="1000" height="650" ${i?'loading="lazy"':''} aria-hidden="${i!==0}">`).join('');
 card.innerHTML=`<div class="ride-gallery" role="region" aria-roledescription="carousel" aria-label="${ride.name} photos"><div class="ride-slide-stage">${photos}<span class="ride-photo-label">${ride.id==='bus'?'ACTUAL FANSONBOARD PH BUS EXPERIENCE':'REGULAR & VIP VAN INTERIOR REFERENCES'}</span></div></div><div class="reference-ride-meta"><div><span class="reference-pickup">PICKUP TIME TBA</span><h3>${ride.name}</h3><small>${packages.length} PACKAGES AVAILABLE</small></div><div class="reference-ride-price"><span>FROM</span><strong>${format(price)}</strong><button type="button" class="ll-link" data-ride-select="${ride.id}" aria-label="Choose ${ride.name}" aria-pressed="false">View packages →</button></div></div>`;
 choices.append(card);
});
const compare=document.getElementById('ride-comparison');
if(compare)compare.innerHTML=`<p class="compare-scroll-note">Scroll sideways on smaller screens to compare all three rides.</p><div class="ride-table-scroll" tabindex="0" role="region" aria-label="Vehicle comparison table"><table class="ride-table"><caption>Choose the interior and inclusions that suit your festival day</caption><thead><tr><th scope="col">At a glance</th><th scope="col">Bus</th><th scope="col">Regular van</th><th scope="col">VIP van</th></tr></thead><tbody><tr><th scope="row">Standard-area fare</th>${rides.map(r=>'<td>'+format(r.id==='bus'?Math.min(...C.packages.bus.map(p=>p.price)):C.packages.van.find(p=>p.id===r.packageId).price)+(r.id==='bus'?'–'+format(Math.max(...C.packages.bus.map(p=>p.price))):'')+'</td>').join('')}</tr><tr><th scope="row">Interior reference</th><td>Coach-style seating</td><td>Standard bench-style seats</td><td>Upgraded individual-style seats</td></tr><tr><th scope="row">Round-trip shuttle</th><td>Included</td><td>Included</td><td>Included</td></tr><tr><th scope="row">Coordinator support</th><td>Included</td><td>Included</td><td>Included</td></tr><tr><th scope="row">Water, pin, stickers & photocard</th><td>Fan Ride & VIP Ride</td><td>Shuttle only</td><td>Included</td></tr><tr><th scope="row">3-hour Cooling Lounge</th><td>FOB VIP Ride · ${format(C.packages.bus.find(p=>p.lounge).price)}</td><td>Not included</td><td>Not included</td></tr><tr><th scope="row">LaLaLakbay Eco Bag</th><td>FOB VIP Ride</td><td>Not included</td><td>Included</td></tr></tbody></table></div>`;
const pricing=document.getElementById('package-price-overview');
if(pricing)pricing.innerHTML=`<div class="ride-table-scroll" tabindex="0" role="region" aria-label="All shuttle package prices"><table class="ride-table"><caption>Round-trip fares per passenger · Standard pickup areas</caption><thead><tr><th scope="col">Vehicle</th><th scope="col">Package</th><th scope="col">LaLaLakbay fare</th></tr></thead><tbody>${[...C.packages.bus,...C.packages.van].map(p=>`<tr><th scope="row">${C.packages.bus.includes(p)?'Bus':p.id==='normal-van'?'Regular Van':'VIP Van'}</th><td>${p.name}</td><td>${format(p.price)}</td></tr>`).join('')}</tbody></table></div>`;
document.querySelectorAll('[data-vehicle-filter]').forEach(b=>b.addEventListener('click',()=>renderPackages(b.dataset.vehicleFilter)));
document.querySelectorAll('[data-ride-select]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();renderPackages(button.dataset.rideSelect);document.getElementById('package-options').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});document.getElementById('package-heading').focus({preventScroll:true});}));
renderPackages('bus');
const pickups=document.getElementById('ll-pickup-list');if(pickups)C.pickupPoints.forEach(name=>{const d=document.createElement('div');d.className='ll-pickup';d.textContent=name;const s=document.createElement('small');s.textContent=C.pickupRules.noBus.includes(name)?'Van only · ₱1,100 regular / ₱1,500 VIP':'Bus & van';d.append(s);pickups.append(d);});
// Photos loop automatically while visible; respect reduced-motion preferences.
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),galleries=[];
document.querySelectorAll('.ride-gallery').forEach(gallery=>{
 const slides=[...gallery.querySelectorAll('.ride-slide')];if(slides.length<2)return;
 const photoLabel=gallery.querySelector('.ride-photo-label');
 const state={element:gallery,index:0,visible:false};
 function sync(){slides.forEach((img,i)=>{img.classList.toggle('active',i===state.index);img.setAttribute('aria-hidden',String(i!==state.index));});}
 state.advance=()=>{const next=(state.index+1)%slides.length;if(slides[next].complete&&slides[next].naturalWidth>0){state.index=next;sync();}};
 sync();galleries.push(state);
});
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{const gallery=galleries.find(s=>s.element===entry.target);if(gallery)gallery.visible=entry.isIntersecting;}),{threshold:.25});galleries.forEach(s=>observer.observe(s.element));
let timer;function start(){clearInterval(timer);timer=setInterval(()=>{if(!document.hidden&&!reduce.matches)galleries.forEach(s=>{if(s.visible)s.advance();});},5000);}start();
window.addEventListener('pagehide',()=>{clearInterval(timer);observer.disconnect();});window.addEventListener('pageshow',()=>{galleries.forEach(s=>observer.observe(s.element));start();});
})();
