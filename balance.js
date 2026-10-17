(function(){
  "use strict";
  const $=s=>document.querySelector(s),C=window.FOB_CONFIG,max=C.maxFileSize;
  const money=n=>new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP",maximumFractionDigits:0}).format(Number(n)||0);
  let currentBooking=null;
  const filePayload=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,mimeType:file.type,data:String(reader.result).split(",")[1]||""});reader.onerror=()=>reject(new Error("Could not read the payment proof."));reader.readAsDataURL(file);});

  $("#lookup-form").addEventListener("submit",async e=>{
    e.preventDefault();
    if(!C.backendUrl||!C.bookingEnabled){$("#lookup-message").textContent="Booking lookup opens with shuttle sales. No information has been submitted.";return;}
    const reference=$("#lookup-reference").value.trim().toUpperCase(),email=$("#lookup-email").value.trim(),button=e.currentTarget.querySelector("button");
    if(!reference||!email){$("#lookup-message").textContent="Please enter your booking reference and email.";return;}
    button.disabled=true;$("#lookup-message").textContent="Finding your booking…";$("#booking-result").hidden=true;
    try{
      const response=await fetch(`${C.backendUrl}?action=lookup&reference=${encodeURIComponent(reference)}&email=${encodeURIComponent(email)}`,{cache:"no-store"}),data=await response.json();
      if(!data.ok||data.campaignId!==C.campaignId)throw new Error(data.error||"This connection belongs to another campaign.");
      currentBooking={...data,email};
      $("#result-passenger").textContent=data.passenger||"—";$("#result-reference").textContent=data.bookingRef;$("#result-dates").textContent=(data.trips||[]).map(t=>t.date).join(" · ")||"—";$("#result-package").textContent=[...new Set(data.packages||[])].join(" · ")||"—";$("#result-total").textContent=money(data.totalFare);$("#result-paid").textContent=money(data.totalPaid);$("#result-balance").textContent=money(data.remainingBalance);$("#result-late-fee").textContent=money(data.lateFee);$("#result-status").textContent=data.paymentStatus||"—";$("#result-due").textContent=money(data.totalDue);$("#balance-amount").value=data.totalDue||data.remainingBalance||"";$("#balance-amount").max=String(data.totalDue||data.remainingBalance||"");
      $("#lookup-message").textContent="";$("#balance-success").hidden=true;$("#balance-form").hidden=Number(data.totalDue)<=0;$("#booking-result").hidden=false;setTimeout(()=>$("#booking-result").scrollIntoView({behavior:"smooth",block:"start"}),50);
    }catch(error){currentBooking=null;$("#lookup-message").textContent=error.message||"Booking not found.";}finally{button.disabled=false;}
  });

  $("#balance-proof").addEventListener("change",e=>{
    const file=e.target.files[0],allowed=["image/jpeg","image/png","image/webp","application/pdf"];
    if(file&&(!allowed.includes(file.type)||file.size>max)){$("#balance-message").textContent=file.size>max?"Proof must be 4 MB or smaller.":"Please choose a JPG, PNG, WEBP, or PDF file.";e.target.value="";}else $("#balance-message").textContent=file?`Ready: ${file.name}`:"";
  });

  const panel=document.createElement('div');panel.className='payment-account-details';panel.hidden=true;document.querySelector('#balance-channel').closest('.field-grid').after(panel);
  $('#balance-channel').addEventListener('change',()=>{const channel=$('#balance-channel').value,a=C.paymentAccounts[channel];panel.replaceChildren();panel.hidden=!a;if(!a)return;const name=document.createElement('strong');name.textContent=a.qrOnly?a.bank+' · official QR':a.name+' · '+a.number;const note=document.createElement('p');note.textContent=a.note;const img=document.createElement('img');img.src=a.qrImage;img.alt=channel+' payment QR';img.style.maxWidth='220px';panel.append(name,note,img);});
  $('#balance-form').addEventListener("submit",async e=>{
    e.preventDefault();if(!C.bookingEnabled||!C.backendUrl)return;if(!e.currentTarget.checkValidity()){e.currentTarget.reportValidity();return;}if(!currentBooking){$("#balance-message").textContent="Please find your booking first.";return;}
    const balanceForm=e.currentTarget,button=balanceForm.querySelector('button[type="submit"]'),amount=Number($("#balance-amount").value),limit=Number(currentBooking.totalDue)||Number(currentBooking.remainingBalance);
    if(amount<=0||amount>limit){$("#balance-message").textContent=`Enter an amount from ₱1 to ${money(limit)}.`;return;}
    button.disabled=true;$("#balance-message").textContent="Submitting payment for verification…";
    try{
      const payload={action:"balance",bookingRef:currentBooking.bookingRef,email:currentBooking.email,paymentChannel:$("#balance-channel").value,referenceNumber:$("#balance-reference").value.trim(),amountPaid:amount,paymentProof:await filePayload($("#balance-proof").files[0])};
      const response=await fetch(C.backendUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)}),result=await response.json();
      if(!result.ok)throw new Error(result.error||"Payment could not be submitted.");
      $("#balance-message").textContent="";$("#balance-success").hidden=false;balanceForm.hidden=true;$("#balance-success").scrollIntoView({behavior:"smooth",block:"center"});
    }catch(error){$("#balance-message").textContent=error.message||"Payment could not be submitted. Please try again.";button.disabled=false;}
  });
})();
