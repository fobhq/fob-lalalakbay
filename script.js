(function(){
  "use strict";
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const money=n=>new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP",maximumFractionDigits:0}).format(n||0);
  const header=$("#site-header");
  if(header){
    const compact=()=>header.classList.toggle("scrolled",scrollY>24); compact(); addEventListener("scroll",compact,{passive:true});
    const toggle=$(".menu-toggle",header); toggle?.addEventListener("click",()=>{const open=header.classList.toggle("menu-open");toggle.setAttribute("aria-expanded",String(open));});
    $$(".main-nav a",header).forEach(a=>a.addEventListener("click",()=>header.classList.remove("menu-open")));
  }
  const vehicleCards=$$(".vehicle-card");
  function setupVehicleSlideshow(vehicle,photos,label,alt){
    const art=$(`.vehicle-card[data-vehicle='${vehicle}'] .vehicle-art`);if(!art)return;
    art.className="vehicle-art vehicle-slideshow";
    art.innerHTML=`<span class="vehicle-slides">${photos.map((src,i)=>`<img class="vehicle-slide${i===0?' active':''}" src="${src}" alt="${i===0?alt:''}" ${i?'loading="lazy"':''}>`).join('')}</span><span class="slideshow-shade"></span><span class="slideshow-label">${label}</span><span class="slideshow-dots" aria-hidden="true">${photos.map((_,i)=>`<i class="${i===0?'active':''}"></i>`).join('')}</span>`;
    let currentSlide=0;
    setInterval(()=>{const slides=$$(".vehicle-slide",art),dots=$$(".slideshow-dots i",art);slides[currentSlide].classList.remove("active");dots[currentSlide].classList.remove("active");currentSlide=(currentSlide+1)%slides.length;slides[currentSlide].classList.add("active");dots[currentSlide].classList.add("active");},4200);
  }
  setupVehicleSlideshow("bus",["assets/bus-experience-01-blurred.png","assets/bus-experience-02-blurred.png","assets/bus-experience-03-blurred.png"],"Actual FansOnBoard PH bus experience","FansOnBoard PH bus experience with passenger faces anonymized");
  setupVehicleSlideshow("van",["assets/vip-van-experience-01.jpg","assets/vip-van-experience-02.jpg","assets/vip-van-experience-03.jpg","assets/vip-van-experience-04-blurred.png"],"Actual VIP Van experience","FansOnBoard PH VIP van interior");
  vehicleCards.forEach(card=>card.addEventListener("click",()=>{
    const kind=card.dataset.vehicle;
    vehicleCards.forEach(c=>{const on=c===card;c.classList.toggle("active",on);c.setAttribute("aria-selected",String(on));});
    $$("[data-package-panel]").forEach(p=>{const on=p.dataset.packagePanel===kind;p.hidden=!on;p.classList.toggle("active",on);});
    const activePanel=document.querySelector(`[data-package-panel="${kind}"]`),activeGrid=$(".package-grid",activePanel);if(activeGrid){activeGrid.scrollLeft=0;activeGrid.dispatchEvent(new Event("scroll"));}
    setTimeout(()=>document.querySelector(`[data-package-panel="${kind}"]`)?.scrollIntoView({behavior:"smooth",block:"nearest"}),40);
  }));

  function setupPackageCarousels(){
    $$(".package-panel .package-grid").forEach(grid=>{
      const cards=$$(".package-card",grid);if(cards.length<2)return;
      const dots=document.createElement("div");dots.className="package-pagination";dots.setAttribute("aria-label","Package slides");
      dots.innerHTML=cards.map((_,index)=>`<button type="button" class="${index===0?'active':''}" aria-label="View package ${index+1}" aria-current="${index===0?'true':'false'}"></button>`).join("");
      grid.insertAdjacentElement("afterend",dots);
      const dotButtons=$$("button",dots);
      const update=()=>{const step=(cards[0]?.getBoundingClientRect().width||1)+12,index=Math.max(0,Math.min(cards.length-1,Math.round(grid.scrollLeft/step)));dotButtons.forEach((dot,i)=>{const active=i===index;dot.classList.toggle("active",active);dot.setAttribute("aria-current",String(active));});};
      let frame;grid.addEventListener("scroll",()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);},{passive:true});
      dotButtons.forEach((dot,index)=>dot.addEventListener("click",()=>grid.scrollTo({left:cards[index].offsetLeft-cards[0].offsetLeft,behavior:"smooth"})));
      update();
    });
  }
  function setupMobileDisclosure(selector,moreLabel,lessLabel){
    const content=$(selector);if(!content)return;
    content.classList.add("mobile-collapsible");if(!content.id)content.id=`mobile-disclosure-${document.querySelectorAll(".mobile-collapsible").length}`;
    const button=document.createElement("button");button.type="button";button.className="mobile-view-toggle";button.textContent=moreLabel;button.setAttribute("aria-expanded","false");
    button.setAttribute("aria-controls",content.id);
    content.insertAdjacentElement("afterend",button);
    button.addEventListener("click",()=>{const open=content.classList.toggle("mobile-expanded");button.textContent=open?lessLabel:moreLabel;button.setAttribute("aria-expanded",String(open));});
  }
  function setupPolicyDisclosure(){
    const article=$(".privacy-copy");if(!article)return;
    const sections=$$(":scope > section",article),visibleCount=document.body.classList.contains("policy-page")?3:2;if(sections.length<=visibleCount)return;
    sections.slice(visibleCount).forEach(section=>section.classList.add("mobile-secondary-section"));
    const button=document.createElement("button");button.type="button";button.className="mobile-view-toggle policy-mobile-toggle";button.textContent=document.body.classList.contains("policy-page")?"View Full Booking Policy":"View Full Privacy Policy";button.setAttribute("aria-expanded","false");article.append(button);
    const setOpen=open=>{article.classList.toggle("mobile-expanded",open);button.textContent=open?"View Less":document.body.classList.contains("policy-page")?"View Full Booking Policy":"View Full Privacy Policy";button.setAttribute("aria-expanded",String(open));};
    button.addEventListener("click",()=>setOpen(!article.classList.contains("mobile-expanded")));
    $$(".privacy-toc a").forEach(link=>link.addEventListener("click",()=>{const target=$(link.getAttribute("href"));if(target?.classList.contains("mobile-secondary-section"))setOpen(true);}));
  }
  setupPackageCarousels();
  setupMobileDisclosure(".location-directory","View More Pickup Points","View Less");
  setupPolicyDisclosure();

  const form=$("#booking-form");
  if(!form) return;
  const C=window.FOB_CONFIG;
  const artistPreferences=window.LLArtistPreferences.create(window.LALALAKBAY_ARTISTS||[]);
  const packageCardTitle=p=>({'normal-bus':'Shuttle Only','bus-freebies':'Shuttle + Fan Freebies','bus-lounge':'Shuttle + Fan Freebies + Cooling Lounge','normal-van':'Regular Van · Shuttle Only','vip-van':'VIP Van + Fan Freebies'}[p.id]||p.detail);
  const packageSummary=p=>`<p class="package-brief">${p.lounge?'Fan freebies + Cooling Lounge access':p.freebies?'Artist-themed fan freebies included':'Roundtrip shuttle only'}</p>`;
  const emptySeatMap=()=>Object.fromEntries(C.eventDates.map(date=>[date,[]]));
  const state={vehicle:"bus",packageIds:["normal-bus"],count:1,dates:[C.eventDates[0]],pickups:{},seatsByDate:emptySeatMap(),availability:{},activeSeatDate:C.eventDates[0]};
  const packageBox=$("#booking-package-choices"), packageAssignments=$("#passenger-package-assignments"), companions=$("#companions"), guardian=$("#guardian-fields");
  $("#passenger-count").value=String(state.count);
  const availablePickupPoints=()=>C.pickupPoints.filter(point=>state.vehicle!=="bus"||!C.pickupRules?.noBus.includes(point));
  const pickupOptions=()=>'<option value="">Choose a pickup point</option>'+availablePickupPoints().map(point=>`<option>${point}</option>`).join("");
  const priceForPickup=(p,pickup)=>state.vehicle==="van"&&pickup?C.pickupRules?.vanPriceOverrides?.[pickup]?.[p.id]??p.price:p.price;
  const datePrices=p=>state.dates.map(date=>priceForPickup(p,state.pickups[date]));
  const packagePriceText=p=>{const prices=[...new Set(datePrices(p))].sort((a,b)=>a-b);return prices.length===1?money(prices[0]):`${money(prices[0])}–${money(prices.at(-1))}`;};
  const packageById=id=>C.packages[state.vehicle].find(p=>p.id===id);
  const selectedPackages=()=>state.packageIds.slice(0,state.count).map(id=>packageById(id)||C.packages[state.vehicle][0]);
  const bookingTotal=()=>selectedPackages().reduce((total,p)=>total+datePrices(p).reduce((sum,price)=>sum+price,0),0);
  const planLabels={full:"Full payment",installment:"₱250 per Slot Installment Plan"};
  function getPaymentPlan(total){
    const type=$("#payment-plan")?.value||"full";
    if(!total)return {type,label:planLabels[type],dueNow:0,items:[]};
    if(type==="full")return {type,label:planLabels[type],dueNow:total,items:[["Due now",total]]};
    const now=new Date(),halfTarget=Math.ceil(total*.5),dueNow=now>new Date("2026-12-31T23:59:59+08:00")?total:now>new Date("2026-11-14T23:59:59+08:00")?halfTarget:Math.min(250*state.count,total),februaryDue=Math.max(halfTarget-dueNow,0),finalDue=Math.max(total-Math.max(halfTarget,dueNow),0);
    return {type,label:planLabels[type],dueNow,items:[["Reservation payment · now",dueNow],["Additional due Nov 14 · reach 50%",februaryDue],["Remaining due Dec 31 · paid in full",finalDue]]};
  }

  function renderTripOptions(){
    // Keep the API's trips array while assigning this event's single date automatically.
    state.dates=[C.eventDates[0]];state.activeSeatDate=C.eventDates[0];
    $("#trip .field-grid").innerHTML='<div class="field full"><div class="per-date-pickups" id="per-date-pickups"></div></div>';
    renderPickupFields();
  }
  function renderPickupFields(){
    const box=$("#per-date-pickups");if(!box)return;
    const available=availablePickupPoints();
    state.dates.forEach(date=>{if(state.pickups[date]&&!available.includes(state.pickups[date]))state.pickups[date]="";});
    box.innerHTML=state.dates.map(date=>`<div class="pickup-date-row"><div><small>${date}</small><strong>${state.vehicle==='bus'?'Bus · Assembly time TBA':'Van · Assembly time TBA'}</strong></div><label class="field"><span>Pickup point</span><select name="pickup-${date.replace(' ','-').toLowerCase()}" data-pickup-date="${date}" required>${pickupOptions()}</select></label></div>`).join('');
    $$('[data-pickup-date]',box).forEach(select=>{select.value=state.pickups[select.dataset.pickupDate]||'';select.addEventListener('change',()=>{state.pickups[select.dataset.pickupDate]=select.value;refreshPackagePrices();renderSummary();});});
  }
  const apiDate=date=>`${date}, 2027`;
  async function loadAvailability(date=state.activeSeatDate){
    if(!C.backendUrl){$("#seat-message").textContent="Preview seat map only. No seat is held or reserved.";return;}
    const key=`${state.vehicle}|${date}`;
    try{
      const response=await fetch(`${C.backendUrl}?action=availability&date=${encodeURIComponent(apiDate(date))}&vehicle=${encodeURIComponent(state.vehicle)}`,{cache:"no-store"});
      const data=await response.json();
      if(!data.ok || data.campaignId!==C.campaignId)throw new Error(data.error||"This booking connection belongs to a different campaign.");
      state.availability[key]=Object.fromEntries((data.seats||[]).map(item=>[String(item.seat),String(item.status||"").toUpperCase()]));
      renderSeats();
    }catch(error){
      delete state.availability[key];renderSeats();$("#seat-message").textContent="Live seat availability could not be refreshed. Please try again before submitting.";
      console.error(error);
    }
  }
  function renderDateDependent(){renderPickupFields();refreshPackagePrices();renderSeatProgress();renderSeats();renderSummary();loadAvailability();}
  function renderSeatProgress(){
    const progress=$("#seat-selection-progress");if(!progress)return;
    progress.innerHTML=`<strong>${state.vehicle==='bus'?'BUS — DESIRED SEATS':'VAN — SEAT SELECTION'}</strong><span>Seats selected: ${state.seatsByDate[state.activeSeatDate].length} of ${state.count}</span>`;
    $("#desired-seat-notice").hidden=state.vehicle!=='bus';
    $("#seat-step-description").textContent=state.vehicle==='bus'?'Choose one desired seat per passenger. Bus seat requests are not final assignments.':'Choose one van seat per passenger.';
  }

  function renderPackages(){
    packageBox.innerHTML=C.packages[state.vehicle].map(p=>{const qty=state.packageIds.filter(id=>id===p.id).length;return `<article class="package-choice${qty?' has-slots':''}" data-package="${p.id}"><span class="package-tier">${p.name}</span><strong>${packageCardTitle(p)}</strong>${packageSummary(p)}<b data-package-price="${p.id}">${packagePriceText(p)}</b><em>per passenger</em><label class="slot-quantity"><span>Slots</span><select data-package-qty="${p.id}">${Array.from({length:C.maxPassengers+1},(_,i)=>`<option value="${i}" ${i===qty?'selected':''}>${i}</option>`).join('')}</select></label></article>`;}).join("");
    $$('[data-package-qty]',packageBox).forEach(select=>select.addEventListener('change',()=>{
      const quantities=$$('[data-package-qty]',packageBox).map(input=>({id:input.dataset.packageQty,qty:Number(input.value)}));
      const total=quantities.reduce((sum,item)=>sum+item.qty,0),message=$("#slot-message");
      if(total<1||total>C.maxPassengers){message.textContent=total<1?'Please select at least one package slot.':`A booking can include up to ${C.maxPassengers} passengers.`;renderPackages();return;}
      message.textContent="";state.packageIds=quantities.flatMap(item=>Array.from({length:item.qty},()=>item.id));state.count=total;$("#passenger-count").value=String(total);renderCompanions();renderPackages();
    }));
    $("#slot-total").textContent=`${state.count} / ${C.maxPassengers} slot${state.count===1?'':'s'}`;
    renderMobileSlotSetup();
  }
  function renderMobileSlotSetup(){
    const box=$("#mobile-slot-setup");if(!box)return;
    const packages=C.packages[state.vehicle];
    box.innerHTML=`<div class="mobile-package-quantities">${packages.map(p=>{const qty=state.packageIds.filter(id=>id===p.id).length;return `<article class="mobile-package-quantity"><div><span>${p.name}</span><strong>${packageCardTitle(p)}</strong>${packageSummary(p)}</div><p><b>${packagePriceText(p)}</b><small>per passenger</small></p><label><span>Slots</span><select data-mobile-package-qty="${p.id}">${Array.from({length:C.maxPassengers+1},(_,i)=>`<option value="${i}" ${i===qty?'selected':''}>${i}</option>`).join('')}</select></label></article>`;}).join('')}</div><p class="mobile-slot-total"><strong>${state.count}</strong> of ${C.maxPassengers} passenger slots selected</p>`;
    $$('[data-mobile-package-qty]',box).forEach(select=>select.addEventListener('change',()=>{
      const quantities=$$('[data-mobile-package-qty]',box).map(input=>({id:input.dataset.mobilePackageQty,qty:Number(input.value)}));
      const total=quantities.reduce((sum,item)=>sum+item.qty,0),message=$("#slot-message");
      if(total<1||total>C.maxPassengers){message.textContent=total<1?'Please keep at least one package slot.':`You can select up to ${C.maxPassengers} passenger slots per booking.`;renderMobileSlotSetup();return;}
      message.textContent="";state.packageIds=quantities.flatMap(item=>Array.from({length:item.qty},()=>item.id));state.count=total;$("#passenger-count").value=String(total);renderCompanions();renderPackages();
    }));
  }
  function refreshPackagePrices(){
    $$('[data-package-price]',packageBox).forEach(price=>{const p=packageById(price.dataset.packagePrice);if(p)price.textContent=packagePriceText(p);});
    renderPackageAssignments();
  }
  function selectVehicle(kind,preselect){
    state.vehicle=kind;state.seatsByDate=emptySeatMap();state.availability={};
    const initial=C.packages[kind].some(p=>p.id===preselect)?preselect:C.packages[kind][0].id;
    state.packageIds=Array.from({length:state.count},()=>initial);
    $$("[data-booking-vehicle]").forEach(b=>b.classList.toggle("active",b.dataset.bookingVehicle===kind));
    $("#window-notice").textContent='Final pickup assembly times will be announced before festival day.';
    renderPackages();renderPackageAssignments();renderDateDependent();
  }
  $$("[data-booking-vehicle]").forEach(btn=>btn.addEventListener("click",()=>selectVehicle(btn.dataset.bookingVehicle)));
  function renderSummary(){
    renderAddOnInterest();
    const packages=selectedPackages(),total=bookingTotal();
    const countInput=$("#passenger-count");countInput.value=String(state.count);countInput.setAttribute("value",String(state.count));
    if(!$("#summary-dates"))$("#summary-count").closest('.fare-line').insertAdjacentHTML('afterend',`<div class="fare-line"><span>Event date</span><strong id="summary-dates"></strong></div>`);
    $("#summary-vehicle").textContent=state.vehicle==='bus'?"Bus":"Van";
    $("#summary-package").textContent=`${packages.length} package${packages.length>1?'s':''} assigned`;
    $("#summary-count").textContent=String(state.count);
    $("#summary-dates").textContent="January 14, 2027";
    $("#summary-total").textContent=money(total);
    const plan=getPaymentPlan(total);
    $("#due-plan").textContent=plan.label;
    $("#amount-due").textContent=money(plan.dueNow);
    const amountPaid=$("#amount-paid");if(amountPaid){amountPaid.setCustomValidity("");amountPaid.min=String(plan.dueNow);amountPaid.placeholder=`Minimum ${money(plan.dueNow)} for ${state.count} slot${state.count>1?'s':''}`;}
    const schedule=$("#payment-schedule");
    if(schedule)schedule.innerHTML=plan.items.length?`<div class="payment-schedule-head"><span>Your payment schedule</span><strong>${plan.type==="full"?"One payment":"₱100/day late fee"}</strong></div><div class="payment-schedule-grid">${plan.items.map(([label,amount],i)=>`<div class="${i===0?'current':''}"><span>${label}</span><strong>${money(amount)}</strong></div>`).join("")}</div>`:`<p>Choose passenger packages to see your personalized payment schedule.</p>`;
    $("#vehicle-label").textContent=state.vehicle==='bus'?"BUS — DESIRED SEATS":"VAN SEATING";
    $("#mobile-summary-line").innerHTML=`${state.count} passenger${state.count>1?'s':''} · ${state.dates.length} day${state.dates.length>1?'s':''} · flexible packages <b>${money(total)}</b>`;
  }
  function renderArtistPreferences(){
    artistPreferences.resize(state.count);
    $$('[data-artist-preference-field]',form).forEach(field=>field.remove());
    const companionCards=$$('.companion-card',companions);
    selectedPackages().forEach((p,index)=>{const target=index===0?$('#primary-artist-preference'):companionCards[index-1];if(target)target.append(artistPreferences.field(index,Boolean(p.freebies)));});
  }
  function collectPassengers(fd){
    return selectedPackages().map((p,index)=>{
      const n=index+1,passenger={name:String(fd.get(index===0?'fullName':`companionName${n}`)||'').trim(),contact:String(fd.get(index===0?'contact':`companionContact${n}`)||'').trim(),minor:index===0?false:fd.get(`minor${n}`)==='yes',packageId:p.id};
      if(p.freebies)passenger.artistPreference=artistPreferences.value(index);
      return passenger;
    });
  }
  function renderPackageAssignments(){
    if(!packageAssignments)return;
    const options=C.packages[state.vehicle];
    while(state.packageIds.length<state.count)state.packageIds.push(options[0].id);
    state.packageIds=state.packageIds.slice(0,state.count).map(id=>options.some(p=>p.id===id)?id:options[0].id);
    packageAssignments.innerHTML=state.packageIds.map((id,index)=>{const p=packageById(id);return `<div class="passenger-package-row"><div><span>Passenger ${index+1}${index===0?' · Primary':''}</span><strong>${p.name}</strong><small>${p.detail}</small></div><div class="assigned-package-price"><span>Package fare</span><strong>${packagePriceText(p)}</strong><small>per selected date</small></div><p>${p.lounge?'Artist-themed fan freebies, 3-hour Cooling Lounge access, and a LaLaLakbay Eco Bag included.':p.freebies?(p.ecoBag?'Artist-themed button pin, stickers, photocard, bottled water, and LaLaLakbay Eco Bag included.':'Artist-themed button pin, stickers, photocard, and bottled water included.'):'Roundtrip shuttle only.'}</p></div>`;}).join('');
    renderArtistPreferences();renderSummary();
  }
  function renderCompanions(){
    const countInput=$("#passenger-count");countInput.value=String(state.count);countInput.setAttribute("value",String(state.count));const saved=Object.fromEntries($$("input",companions).filter(x=>x.type!=="radio"||x.checked).map(x=>[x.name,x.value]));companions.innerHTML="";
    const defaultPackage=C.packages[state.vehicle][0].id;
    while(state.packageIds.length<state.count)state.packageIds.push(defaultPackage);
    state.packageIds=state.packageIds.slice(0,state.count);
    const primaryPackage=packageById(state.packageIds[0]);$(".passenger-subheading>span").textContent=`Booking contact · Passenger 1 · ${primaryPackage.name}`;
    if(state.count>1)companions.insertAdjacentHTML("beforeend",`<div class="passenger-subheading companion-heading"><span>Companion details</span><p>Add the full name and contact number of every passenger included in this booking.</p></div>`);
    for(let i=2;i<=state.count;i++){const passengerPackage=packageById(state.packageIds[i-1]);companions.insertAdjacentHTML("beforeend",`<div class="companion-card"><h3>Passenger ${i} · ${passengerPackage.name}</h3><div class="field-grid companion-fields"><div class="field"><label for="companion-name-${i}">Companion Full Name</label><input id="companion-name-${i}" name="companionName${i}" autocomplete="name" required></div><div class="field"><label for="companion-contact-${i}">Companion Contact Number</label><input id="companion-contact-${i}" name="companionContact${i}" type="tel" inputmode="tel" autocomplete="tel" placeholder="09XX XXX XXXX" required></div><div class="field full"><span>Is this passenger a minor?</span><div class="choice-row"><label class="choice"><input type="radio" name="minor${i}" value="no" checked><span>No</span></label><label class="choice"><input type="radio" name="minor${i}" value="yes"><span>Yes</span></label></div></div></div></div>`);}
    $$('input[type="radio"][name^="minor"]',companions).forEach(r=>r.addEventListener("change",updateGuardian));
    $$("input",companions).forEach(x=>{if(saved[x.name]!==undefined){if(x.type==="radio")x.checked=x.value===saved[x.name];else x.value=saved[x.name];}});
    Object.keys(state.seatsByDate).forEach(date=>{if(state.seatsByDate[date].length>state.count)state.seatsByDate[date]=state.seatsByDate[date].slice(0,state.count);});
    updateGuardian();renderPackageAssignments();renderSummary();renderSeatProgress();renderSeats();
  }
  function updateGuardian(){
    const any=$$('input[name^="minor"]:checked',companions).some(x=>x.value==="yes"); guardian.hidden=!any;
    $$("input",guardian).forEach(i=>i.required=any);
  }
  const addOnInterestLabels={UNSPECIFIED:'Not specified',INTERESTED:'Yes — send me details',MAYBE:'Maybe — still deciding',NOT_NOW:'Not interested for now',INCLUDED:'Already included with Bus VIP Ride'};
  function collectAddOnInterest(fd){
    const packages=selectedPackages(),included=packages.filter(p=>p.lounge).length;
    return {lounge:included===packages.length?'INCLUDED':String(fd.get('loungeInterest')||'UNSPECIFIED'),meals:String(fd.get('mealInterest')||'UNSPECIFIED')};
  }
  function renderAddOnInterest(){
    const note=$("#lounge-included-note"),select=$("#lounge-interest");if(!note||!select)return;
    const packages=selectedPackages(),included=packages.filter(p=>p.lounge).length,all=included===packages.length;
    select.disabled=all;
    note.textContent=all?'3-hour Cooling Lounge access is already included for all passengers in this booking.':included?`3-hour lounge access is already included for ${included} Bus VIP passenger${included===1?'':'s'}. The interest question below applies to the other passengers.`:'Cooling Lounge is included with Bus FOB VIP Ride only. Other packages, including VIP Van, can register interest in lounge access.';
  }
  function renderPaymentAccount(){
    const channel=$("#payment-channel")?.value||"",account=C.paymentAccounts?.[channel],box=$("#payment-account-details");
    if(!box)return;
    if(!C.bookingEnabled){box.hidden=false;box.innerHTML='<p class="ll-form-note">Booking is not open. Do not send a payment or upload real payment proof in this preview.</p>';return;}
    if(!account){box.hidden=true;box.innerHTML="";return;}
    const accountFields=account.qrOnly
      ? `<div><small>Bank</small><strong>${account.bank}</strong></div><div><small>Payment method</small><strong>Official QR only</strong></div>`
      : `<div><small>Account name</small><strong>${account.name}</strong></div><div><small>${channel} number</small><strong>${account.number}</strong></div>`;
    box.innerHTML=`<div class="payment-account-head"><span>${channel} payment details</span><b>Official FansOnBoard account</b></div><div class="payment-account-body"><div><div class="payment-account-grid">${accountFields}</div><p>${account.note}</p><small class="payment-qr-help">Scan the QR code directly from this page.</small></div><figure class="payment-qr"><img src="${account.qrImage}" alt="Official ${channel==='Bank Transfer'?'BDO':channel} payment QR code"></figure></div>`;
    box.hidden=false;
  }
  $("#payment-plan").addEventListener("change",renderSummary);
  $("#payment-channel").addEventListener("change",renderPaymentAccount);
  const priorityRequest=$("#priority-request"),priorityReasons=$("#priority-reasons");
  const hasPriorityReason=()=>$$('input[name="priorityReason"]:checked').length>0;
  function updatePriorityRequest(){
    priorityReasons.hidden=!priorityRequest.checked;
    if(!priorityRequest.checked){$$('input[name="priorityReason"]',priorityReasons).forEach(box=>box.checked=false);const reserved=new Set(C.seatLayouts.bus.priority);Object.keys(state.seatsByDate).forEach(date=>state.seatsByDate[date]=state.seatsByDate[date].filter(id=>!reserved.has(id)));}
    $("#priority-message").textContent=priorityRequest.checked&&!hasPriorityReason()?"Choose at least one reason to unlock priority seats.":"";
    renderSeatProgress();renderSeats();
  }
  priorityRequest.addEventListener("change",updatePriorityRequest);
  $$('input[name="priorityReason"]',priorityReasons).forEach(box=>box.addEventListener("change",updatePriorityRequest));

  function renderSeats(){
    const grid=$("#seat-grid"); if(!grid)return;
    const activeSeats=state.seatsByDate[state.activeSeatDate];
    const legend=$(".seat-legend");
    let html="";
    if(state.vehicle==='bus'){
      const layout=C.seatLayouts.bus,rows=layout.rows;
      const priority=new Set(layout.priority),volunteer=new Set(layout.volunteer||[]),priorityAccess=priorityRequest.checked&&hasPriorityReason(),live=state.availability[`bus|${state.activeSeatDate}`]||{};
      const makeSeat=id=>{const liveStatus=live[id]||"",unavailable=volunteer.has(id)||(C.bookingEnabled?!["AVAILABLE",...(priority.has(id)?["RESERVED"]:[])].includes(liveStatus):["LOCKED","BOOKED","ON HOLD"].includes(liveStatus)),reserved=(priority.has(id)&&!priorityAccess)||unavailable,status=volunteer.has(id)?'unavailable volunteer':unavailable?'unavailable':priority.has(id)&&!priorityAccess?'priority':priority.has(id)?'priority-access':'';const label=volunteer.has(id)?'<small>Volunteer</small>':priority.has(id)?'<small>Priority</small>':unavailable?'<small>Unavailable</small>':'';return `<button type="button" class="seat bus-seat ${status} ${activeSeats.includes(id)?'selected':''}" aria-pressed="${activeSeats.includes(id)}" data-seat="${id}" ${reserved?'disabled':''}><strong>${id}</strong>${label}</button>`;};
      html=`<div class="bus-front"><span class="driver-block">Driver</span><small>Front of bus</small><span class="entrance-block">Entrance</span></div><p class="seat-guide">${priorityAccess?'Priority request active. Priority seats are now available for selection.':'Select an available regular seat. Priority seats unlock after an eligible priority-seating request.'}</p><div class="lilibus-grid">${rows.map((row,i)=>`<div class="bus-seat-row">${makeSeat(row[0])}${makeSeat(row[1])}<span class="row-label">Row ${i+1}</span>${makeSeat(row[2])}${makeSeat(row[3])}</div>`).join('')}<div class="back-seat-row">${layout.backRow.map(makeSeat).join('')}</div><small class="back-label">Back row · L1–L5</small></div>`;
      legend.innerHTML=`<span><i></i>Available</span><span><i class="l-selected"></i>Selected</span><span><i class="l-priority"></i>${priorityAccess?'Priority eligible':'Priority eligibility required'}</span>`;
      grid.closest('.seat-map').classList.add('bus-map');
    }else{
      const live=state.availability[`van|${state.activeSeatDate}`]||{};let number=1;for(let i=0;i<Math.ceil(15/4)*5;i++){if(i%5===2){html+='<span aria-hidden="true"></span>';continue;}if(number>15)break;const id=String(number),unavailable=C.bookingEnabled?live[id]!=="AVAILABLE":["LOCKED","BOOKED","ON HOLD"].includes(live[id]||"");html+=`<button type="button" class="seat ${unavailable?'unavailable':''} ${activeSeats.includes(id)?'selected':''}" aria-pressed="${activeSeats.includes(id)}" data-seat="${id}" ${unavailable?'disabled':''}>${id}</button>`;number++;}
      legend.innerHTML='<span><i></i>Available</span><span><i class="l-selected"></i>Selected</span>';
      grid.closest('.seat-map').classList.remove('bus-map');
    }
    grid.className=state.vehicle==='bus'?'seats lilibus-seats':'seats';grid.innerHTML=html;
    $$(".seat:not(:disabled)",grid).forEach(btn=>btn.addEventListener("click",()=>{
      const id=btn.dataset.seat,at=activeSeats.indexOf(id);
      if(at>=0)activeSeats.splice(at,1);else if(activeSeats.length<state.count)activeSeats.push(id);else{$("#seat-message").textContent=`Choose up to ${state.count} seat${state.count>1?'s':''} ${state.vehicle==='bus'?'(desired seats, not final)':''}.`;return;}
      $("#seat-message").textContent=`${activeSeats.length} of ${state.count} seat${state.count>1?'s':''} selected ${state.vehicle==='bus'?'(desired seats, not final)':''}.`;renderSeatProgress();renderSeats();
    }));
  }

  $("#amount-paid").addEventListener("input",()=>$("#amount-paid").setCustomValidity(""));
  const proof=$("#payment-proof");if(!C.bookingEnabled){proof.required=false;proof.disabled=true;$("#reference-number").required=false;$("#reference-number").placeholder="Preview only";}proof.addEventListener("change",()=>{
    const file=proof.files[0],msg=$("#file-message");msg.textContent="";
    if(!file)return;const allowed=["image/jpeg","image/png","image/webp","application/pdf"];
    if(!allowed.includes(file.type)){msg.textContent="Please choose a JPG, PNG, WEBP, or PDF file.";proof.value="";}
    else if(file.size>C.maxFileSize){msg.textContent="That file is larger than 4 MB. Please choose a smaller file.";proof.value="";}
    else msg.textContent=`Ready: ${file.name}`;
  });
  const wizardSteps=$$(".form-step"),wizardButtons=$$(".progress-nav button");
  let activeWizardStep=0;
  const nextLabels=["Continue to Passengers","Continue to Seat Preferences","Continue to Payment","Continue to Review"];
  document.body.classList.add("wizard-ready");
  wizardSteps.forEach((step,index)=>{
    const heading=$(".form-step-heading",step);
    heading.insertAdjacentHTML("beforebegin",`<div class="wizard-status"><span>Step ${index+1} of ${wizardSteps.length}</span><small>${index===0?'Start with your trip plan':'Selections stay on this page until you leave'}</small></div>`);
    if(index<wizardSteps.length-1)step.insertAdjacentHTML("beforeend",`<div class="wizard-actions">${index?'<button class="button button-ghost" type="button" data-wizard-back>Back</button>':''}<button class="button wizard-next" type="button" data-wizard-next="${index+1}">${nextLabels[index]}</button></div>`);
    else $(".submit-row",step).insertAdjacentHTML("afterbegin",'<button class="button button-ghost" type="button" data-wizard-back>Back</button>');
  });
  function showStep(index,smooth=true){
    activeWizardStep=Math.max(0,Math.min(index,wizardSteps.length-1));
    wizardSteps.forEach((step,i)=>{step.classList.toggle("wizard-active",i===activeWizardStep);step.setAttribute("aria-hidden",i===activeWizardStep?"false":"true");});
    wizardButtons.forEach((btn,i)=>{btn.classList.toggle("active",i===activeWizardStep);btn.classList.toggle("completed",i<activeWizardStep);btn.setAttribute("aria-current",i===activeWizardStep?"step":"false");});
    $("#mobile-continue").textContent=activeWizardStep===wizardSteps.length-1?"Review & Submit":"Continue";
    if(smooth)document.querySelector(".booking-shell").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function advance(index){if(index<=activeWizardStep){showStep(index);return;}const step=wizardSteps[activeWizardStep],invalid=step.querySelector(":invalid");if(invalid){invalid.reportValidity();return;}if(activeWizardStep===1&&priorityRequest.checked&&!hasPriorityReason()){$("#priority-message").textContent="Choose a priority-seating reason.";return;}if(activeWizardStep===2&&state.seatsByDate[state.activeSeatDate].length!==state.count){$("#seat-message").textContent="Choose one seat for every passenger.";return;}if(activeWizardStep===3){const paid=Number($("#amount-paid").value),total=bookingTotal();if(paid<getPaymentPlan(total).dueNow||paid>total){$("#amount-paid").setCustomValidity(`Enter an amount between ${money(getPaymentPlan(total).dueNow)} and ${money(total)}.`);$("#amount-paid").reportValidity();return;}}showStep(Math.min(index,activeWizardStep+1));}
  wizardButtons.forEach((btn,index)=>btn.addEventListener("click",()=>advance(index)));
  $$('[data-wizard-next]').forEach(btn=>btn.addEventListener("click",()=>advance(Number(btn.dataset.wizardNext))));
  $$('[data-wizard-back]').forEach(btn=>btn.addEventListener("click",()=>showStep(activeWizardStep-1)));
  const policyBox=$("#booking-policies"),policyList=$(".policy-list",policyBox);
  if(policyBox&&policyList){
    const details=document.createElement("details"),summary=document.createElement("summary");
    details.className="policy-details";
    summary.innerHTML='<span><strong>Important Booking Policies</strong><small>Cooling Lounge, payments, transfers &amp; travel rules</small></span><b>View policies +</b>';
    const fullPolicyLink=$(".policy-view-link",policyBox);details.append(summary,policyList);policyBox.replaceChildren(details);if(fullPolicyLink)policyBox.append(fullPolicyLink);
    details.addEventListener("toggle",()=>{$("b",summary).textContent=details.open?"Hide policies −":"View policies +";});
  }
  const routeDetails=$("#pickup-notice");
  routeDetails?.addEventListener("toggle",()=>{$("summary b",routeDetails).textContent=routeDetails.open?"Hide details −":"View details +";});
  showStep(0,false);

  function validate(){
    const msg=$("#form-message");msg.textContent="";
    const missingPreference=selectedPackages().findIndex((p,index)=>p.freebies&&!artistPreferences.value(index));
    if(missingPreference>=0){showStep(1);const select=document.getElementById('artist-preference-'+(missingPreference+1));if(select){select.focus();select.reportValidity();}msg.textContent='Please choose an artist or Surprise Me for Passenger '+(missingPreference+1)+'.';return false;}
    const emailInput=$("#email"),email=String(emailInput?.value||"").trim().toLowerCase(),emailTypos={"gmaill.com":"gmail.com","gmial.com":"gmail.com","gmal.com":"gmail.com","gmail.co":"gmail.com","yahooo.com":"yahoo.com"},emailDomain=email.split("@")[1];
    emailInput?.setCustomValidity("");
    if(emailTypos[emailDomain]){
      emailInput.setCustomValidity(`Please check your email address. Did you mean @${emailTypos[emailDomain]}?`);
      showStep(1);
      setTimeout(()=>emailInput.reportValidity(),350);
      msg.textContent=`Please correct the email address before submitting. Did you mean @${emailTypos[emailDomain]}?`;
      return false;
    }
    if(!form.checkValidity()){const invalid=form.querySelector(":invalid"),step=invalid&&invalid.closest(".form-step"),index=wizardSteps.indexOf(step);if(index>=0)showStep(index);setTimeout(()=>invalid&&invalid.reportValidity(),350);msg.textContent="Please complete all required fields.";return false;}
    if(state.packageIds.length!==state.count||state.packageIds.some(id=>!packageById(id))){msg.textContent="Please choose one package for every passenger.";showStep(1);return false;}
    if(priorityRequest.checked&&!hasPriorityReason()){$("#priority-message").textContent="Please choose at least one priority-seating reason.";msg.textContent="Please complete your priority-seating request.";showStep(1);setTimeout(()=>$("#priority-request").scrollIntoView({behavior:"smooth",block:"center"}),350);return false;}
    const incompleteDate=state.dates.find(date=>state.seatsByDate[date].length!==state.count);
    if(incompleteDate){state.activeSeatDate=incompleteDate;renderSeatProgress();renderSeats();msg.textContent=`Please select ${state.count} seat${state.count>1?'s':''} for ${incompleteDate}.`;showStep(2);return false;}
    const total=bookingTotal(),plan=getPaymentPlan(total),paid=Number($("#amount-paid").value);
    if(paid<plan.dueNow){msg.textContent=`Amount paid must be at least ${money(plan.dueNow)} for this payment plan.`;showStep(3);return false;}
    if(paid>total){msg.textContent=`Amount paid cannot be higher than the ${money(total)} total fare.`;showStep(3);return false;}
    return true;
  }
  function reviewItem(label,value){const escape=v=>String(v||"—").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));return `<div class="review-item"><small>${escape(label)}</small><strong>${escape(value)}</strong></div>`;}
  $("#review-button").addEventListener("click",()=>{
    if(!validate())return;
    $("#submit-error").hidden=true;
    $("#submit-error").textContent="";
    const countInput=$("#passenger-count");countInput.value=String(state.count);countInput.defaultValue=String(state.count);
    const fd=new FormData(form),packages=selectedPackages(),total=bookingTotal();
    const companionNames=[],companionContacts=[];for(let i=2;i<=state.count;i++){companionNames.push(fd.get(`companionName${i}`));companionContacts.push(fd.get(`companionContact${i}`));}
    const pickupPlan=state.dates.map(date=>`${date}: ${state.pickups[date]}`).join(" · "),seatPlan=state.dates.map(date=>`${date}: ${state.seatsByDate[date].join(', ')}`).join(" · ");
    const passengerNames=[fd.get("fullName"),...companionNames],packagePlan=packages.map((p,i)=>`${passengerNames[i]||`Passenger ${i+1}`}: ${p.name} — ${p.detail}`).join(" · ");
    const farePlan=packages.map((p,i)=>`${passengerNames[i]||`Passenger ${i+1}`}: ${money(datePrices(p).reduce((sum,price)=>sum+price,0))}`).join(" · "),paymentPlan=getPaymentPlan(total),paid=Number(fd.get("amountPaid"));
    const schedulePlan=paymentPlan.items.map(([date,amount])=>`${date}: ${money(amount)}`).join(" · ");
    const loungePassengers=packages.map((p,i)=>p.lounge?passengerNames[i]||`Passenger ${i+1}`:null).filter(Boolean);
    const priorityReasonValues=$$('input[name="priorityReason"]:checked').map(box=>box.value);
    const companionContactPlan=companionNames.map((name,index)=>`${name}: ${companionContacts[index]}`).join(" · ");
    const preferenceReview=collectPassengers(fd).map((passenger,index)=>passenger.artistPreference?'<div class="review-preference">'+reviewItem('Passenger '+(index+1)+' · '+passenger.name,'Package: '+packages[index].name+' · Artist Preference: '+artistPreferences.label(passenger.artistPreference))+'</div>':'').join('');
    $("#review-grid").innerHTML=reviewItem("Event","LALALA FEST Manila")+reviewItem("Date","January 14, 2027")+reviewItem("Venue","Philippine Arena, Bulacan")+reviewItem("Vehicle",state.vehicle.toUpperCase())+reviewItem("Pickup Points",pickupPlan)+reviewItem("Pickup Window",state.vehicle==='bus'?"Assembly time TBA":"Assembly time TBA")+reviewItem("Primary Passenger",fd.get("fullName"))+reviewItem("Email",fd.get("email"))+reviewItem("Contact Number",fd.get("contact"))+reviewItem("Companions",companionNames.join(", ")||"None")+reviewItem("Companion Contact Numbers",companionContactPlan||"None")+reviewItem("Passenger Count",state.count)+reviewItem("Package Per Passenger",packagePlan)+preferenceReview+reviewItem("Fare Per Passenger",farePlan)+reviewItem("Cooling Lounge Access",loungePassengers.join(", ")||"None")+reviewItem("Lounge interest — no extra charge",addOnInterestLabels[collectAddOnInterest(fd).lounge])+reviewItem("Meal interest — no extra charge",addOnInterestLabels[collectAddOnInterest(fd).meals])+reviewItem("Priority Seating Request",priorityRequest.checked?priorityReasonValues.join(", "):"No")+reviewItem(state.vehicle==='bus'?"Desired seats — not final":"Van seats",seatPlan)+reviewItem("Payment Channel",fd.get("paymentChannel"))+reviewItem("Payment Reference",fd.get("referenceNumber"))+reviewItem("Payment Plan",paymentPlan.label)+reviewItem("Plan Schedule",schedulePlan)+reviewItem("Amount Submitted",money(paid))+reviewItem("Remaining Balance",money(Math.max(total-paid,0)))+reviewItem("50% Deadline","November 14, 2026")+reviewItem("Full-payment Deadline","December 31, 2026")+reviewItem("Late Fee","₱100 per overdue day")+reviewItem("Total Fare",money(total));
    $("#review-modal").hidden=false;document.body.style.overflow="hidden";
  });
  $("#edit-booking").addEventListener("click",()=>{$("#review-modal").hidden=true;document.body.style.overflow="";});
  const filePayload=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,mimeType:file.type,data:String(reader.result).split(",")[1]||""});reader.onerror=()=>reject(new Error("Could not read the proof of payment."));reader.readAsDataURL(file);});
  $("#confirm-booking").addEventListener("click",async()=>{
    if(!validate())return;
    if(!C.bookingEnabled || !C.backendUrl){$("#submit-error").hidden=false;$("#submit-error").textContent="Booking is not open yet. This preview does not reserve seats, upload proof, or collect payment.";return;}
    const button=$("#confirm-booking"),originalButtonText=button.textContent;
    button.disabled=true;
    button.textContent="Submitting…";
    $("#submit-error").hidden=true;
    $("#review-modal").hidden=true;
    $("#loading-overlay").hidden=false;
    const slowNotice=setTimeout(()=>{
      $("#submission-progress-detail").textContent="Still saving your booking and payment proof. Please wait and do not submit again.";
    },7000);
    try{
      const fd=new FormData(form),proofFile=proof.files[0];
      const passengers=collectPassengers(fd);
      const requestId=state.requestId||(state.requestId=crypto.randomUUID());
      const payload={requestId,termsAccepted:$("#terms-check").checked,privacyAccepted:$("#consent-check").checked,action:"booking",vehicle:state.vehicle,fullName:passengers[0].name,email:fd.get("email"),contact:fd.get("contact"),telegram:fd.get("telegram"),facebook:String(fd.get("facebook")||"").trim(),addOnInterest:collectAddOnInterest(fd),passengers,trips:state.dates.map(date=>({date:apiDate(date),pickup:state.pickups[date],time:state.vehicle==="bus"?"Assembly time TBA":"Assembly time TBA",seats:state.seatsByDate[date]})),priorityRequest:priorityRequest.checked,priorityReasons:$$('input[name="priorityReason"]:checked').map(box=>box.value),paymentPlan:getPaymentPlan(bookingTotal()).label,paymentChannel:fd.get("paymentChannel"),referenceNumber:fd.get("referenceNumber"),amountPaid:Number(fd.get("amountPaid")),guardianName:fd.get("guardianName"),guardianNumber:fd.get("guardianNumber"),paymentProof:await filePayload(proofFile)};
      const response=await fetch(C.backendUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)}),result=await response.json();
      if(!result.ok)throw new Error(result.error||"Booking could not be submitted.");
      $("#booking-reference").textContent=result.bookingRef;$("#confirmation-email").textContent=String(fd.get("email")||"your email address");form.hidden=true;$(".mobile-summary").hidden=true;$("#success-screen").hidden=false;scrollTo(0,0);document.body.style.overflow="";
    }catch(error){
      const message=error.message||"We could not confirm the submission response.";
      $("#form-message").textContent=message;
      $("#submit-error").textContent=`${message} If you already waited after tapping Submit, do not submit again yet—contact FansOnBoard PH so we can check whether your booking was saved.`;
      $("#submit-error").hidden=false;
      form.hidden=false;
      showStep(4,false);
      $("#review-modal").hidden=false;
      document.body.style.overflow="hidden";
      await loadAvailability();
    }finally{
      clearTimeout(slowNotice);
      $("#submission-progress-detail").textContent="Please do not close this page. Saving may take up to 30 seconds.";
      $("#loading-overlay").hidden=true;
      button.disabled=false;
      button.textContent=originalButtonText;
    }
  });
  $("#mobile-continue").addEventListener("click",()=>activeWizardStep<wizardSteps.length-1?advance(activeWizardStep+1):$("#review-button").click());
  const params=new URLSearchParams(location.search),v=params.get("vehicle")==="van"?"van":"bus",p=params.get("package");
  renderCompanions();renderTripOptions();selectVehicle(v,C.packages[v].some(x=>x.id===p)?p:null);
})();
