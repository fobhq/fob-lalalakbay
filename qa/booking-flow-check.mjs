import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('build/script.js'),html=read('build/booking.html'),css=read('build/booking-flow.css');
const fn=(name,next)=>js.slice(js.indexOf('  function '+name+'('),js.indexOf(next,js.indexOf('  function '+name+'(')));
assert.ok(!/concertDates|Choose concert dates|seat-date-tabs|data-seat-date/.test(js+html));
assert.equal((html.match(/class="form-step"/g)||[]).length,5);
assert.ok(html.indexOf('DESIRED SEATS ONLY — NOT YET FINAL')<html.indexOf('class="seat-map-scroll"'));
assert.ok(html.includes('first week of January 2027'));
assert.ok(css.includes('grid-template-columns:minmax(0,1fr)'));
assert.ok(css.includes('max-width:1200px'));
assert.ok(css.includes('overflow-x:auto'));
assert.ok(css.includes('min-width:470px'));
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
// Run real fixed-date and progress functions against minimal DOM nodes.
const nodes=Object.fromEntries(['#trip .field-grid','#seat-selection-progress','#desired-seat-notice','#seat-step-description','#amount-paid','#seat-message','#priority-message'].map(k=>[k,{innerHTML:'',textContent:'',hidden:false,value:'250',reportValidity(){this.reported=true;},setCustomValidity(v){this.validity=v;}}]));
const C={eventDates:['January 14']},state={dates:[],vehicle:'bus',count:3,seatsByDate:{'January 14':['C1','C2']}};
let renderedPickup=0,shown=[];
const ctx=vm.createContext({C,state,$:s=>nodes[s],renderPickupFields:()=>renderedPickup++,money:x=>'₱'+x,bookingTotal:()=>2997,getPaymentPlan:()=>({dueNow:750}),showStep:i=>shown.push(i),priorityRequest:{checked:false},hasPriorityReason:()=>false,wizardSteps:[{querySelector:()=>null},{querySelector:()=>null},{querySelector:()=>null},{querySelector:()=>null},{querySelector:()=>null}],activeWizardStep:0});
vm.runInContext(fn('renderTripOptions','  function renderPickupFields')+fn('renderSeatProgress','\n  function renderPackages')+fn('advance','  wizardButtons.forEach'),ctx);
vm.runInContext('renderTripOptions();renderSeatProgress()',ctx);
assert.equal(JSON.stringify(state.dates),JSON.stringify(['January 14']));assert.equal(renderedPickup,1);
assert.match(nodes['#seat-selection-progress'].innerHTML,/Seats selected: 2 of 3/);assert.equal(nodes['#desired-seat-notice'].hidden,false);
state.count=1;state.seatsByDate['January 14']=[];vm.runInContext('renderSeatProgress()',ctx);assert.match(nodes['#seat-selection-progress'].innerHTML,/0 of 1/);
state.vehicle='van';vm.runInContext('renderSeatProgress()',ctx);assert.equal(nodes['#desired-seat-notice'].hidden,true);assert.match(nodes['#seat-selection-progress'].innerHTML,/VAN/);
// A navigation click moves at most one step; required fields and seat count block it.
vm.runInContext('advance(4)',ctx);assert.equal(shown.at(-1),1);
let reports=0;ctx.wizardSteps[0].querySelector=()=>({reportValidity:()=>reports++});shown=[];vm.runInContext('advance(4)',ctx);assert.equal(reports,1);assert.equal(shown.length,0);
ctx.activeWizardStep=2;vm.runInContext('advance(4)',ctx);assert.equal(shown.length,0);assert.match(nodes['#seat-message'].textContent,/every passenger/);
state.seatsByDate['January 14']=['1'];vm.runInContext('advance(4)',ctx);assert.equal(shown.at(-1),3);
ctx.activeWizardStep=3;shown=[];vm.runInContext('advance(4)',ctx);assert.equal(shown.length,0);assert.ok(nodes['#amount-paid'].reported);
nodes['#amount-paid'].value='1000';nodes['#amount-paid'].validity='';vm.runInContext('advance(4)',ctx);assert.equal(shown.at(-1),4);
vm.runInContext('advance(1)',ctx);assert.equal(shown.at(-1),1);assert.deepEqual(state.seatsByDate['January 14'],['1']);
// Bus requests validate against the real inventory but never write or hold it.
const backend=vm.createContext({console,Date,Utilities:{formatDate:()=> 'January 14, 2027'}});
vm.runInContext(read('apps-script/LaLaLakbay_Backend_Code.gs'),backend);
const rows=[['Date','Seat','Type','Status'],['January 14, 2027','C1','PASSENGER','AVAILABLE'],['January 14, 2027','A1','PRIORITY','RESERVED'],['January 14, 2027','M1','VOLUNTEER','RESERVED'],['January 14, 2027','C2','PASSENGER','LOCKED'],['January 14, 2027','VAN-1','VAN','AVAILABLE']];
let writes=0;
backend.inventory={getDataRange:()=>({getValues:()=>rows}),getRange:()=>({setValues:()=>writes++})};
vm.runInContext('campaignSpreadsheet_=()=>({getSheetByName:()=>inventory});ensureVanInventory_=()=>{}',backend);
backend.pax=[{name:'Demo'}];backend.tickets=[{ticketId:'TEST-01',role:'PRIMARY'}];backend.trip=[{date:'January 14, 2027',pickup:'SM North EDSA',seats:['C1']}];backend.body={};
const run=s=>vm.runInContext(s,backend);
run('lockSelectedSeats_("A","bus",pax,trip,tickets,body,true)');run('lockSelectedSeats_("B","bus",pax,trip,tickets,body,true)');assert.equal(writes,0,'Two preference requests must not hold the same desired seat');
for(const id of ['A1','M1','C2','UNKNOWN']){backend.trip[0].seats=[id];assert.throws(()=>run('lockSelectedSeats_("A","bus",pax,trip,tickets,body,true)'));assert.equal(writes,0);}
backend.trip[0].seats=['A1'];backend.body={priorityRequest:true,priorityReasons:['Senior (60+)']};run('lockSelectedSeats_("A","bus",pax,trip,tickets,body,true)');assert.equal(writes,0);
backend.trip[0].seats=['C1'];run('lockSelectedSeats_("OFFICIAL","bus",pax,trip,tickets,body)');assert.equal(writes,1,'Separate official-assignment helper remains available');
backend.trip[0].seats=['1'];run('lockSelectedSeats_("VAN","van",pax,trip,tickets,body,false)');assert.equal(writes,2,'Van inventory behavior is retained');
assert.ok(read('apps-script/LaLaLakbay_Backend_Code.gs').includes("body, vehicle === 'bus')"));
// Pending and verified emails distinguish requests from assignments.
let mail=[];backend.GmailApp={sendEmail:(...args)=>mail.push(args)};backend.MailApp={sendEmail:(...args)=>mail.push(args)};
vm.runInContext(read('apps-script/LaLaLakbay_Email_Templates.gs'),backend);
run('sendLaLaLakbayMail_=(to,subject,text,html)=>mailCapture(html)');backend.mailCapture=html=>mail.push(html);
backend.emailBooking={email:'test@example.com',fullName:'Demo',vehicle:'bus',seatPolicy:'PREFERENCE',trips:[{date:'January 14, 2027',seats:['C1'],pickup:'SM MOA'}]};
run('sendLaLaLakbayPendingEmail(emailBooking);sendLaLaLakbayConfirmedEmail(emailBooking)');
for(const html of mail){assert.match(html,/DESIRED SEATS — NOT FINAL/);assert.match(html,/first week of January 2027/);assert.ok(!html.includes('SEATS TEMPORARILY HELD'));}
console.log('PASS: fixed date/no date controls, five steps, required-field and seat-count gates, payment gate, navigation persistence, dynamic progress/van distinction, nonlocking bus preferences, priority/volunteer rules, separate official assignments, preserved van locking, and pending/verified email copy. Responsive CSS structure checked; browser visual QA not performed.');
// Exercise complete bus creation twice against shared inventory and separate booking records.
const bookingRows=[Array(31).fill('')],paymentRows=[Array(22).fill('')];
const table=data=>({getLastRow:()=>data.length,getMaxColumns:()=>31,getDataRange:()=>({getValues:()=>data}),appendRow:r=>data.push(r),getRange:()=>({getValue:()=>'',setValue:()=>{},clearContent:()=>{}})});
backend.tables={Bookings:table(bookingRows),Payments:table(paymentRows),Seat_Inventory:backend.inventory};
run('campaignSpreadsheet_=()=>({getSheetByName:name=>tables[name]});saveProof_=()=>"private-proof";let bookingSequence=0;makeBookingReference_=()=>"TEST-"+(++bookingSequence);makeReference_=()=>"PAY-"+bookingSequence;rebuildReviewSheets_=()=>{};buildEmailBooking_=()=>({});sendLaLaLakbayPendingEmail=()=>{};markBookingCell_=()=>{};');
backend.submission={requestId:'A',email:'test@example.com',fullName:'Demo',contact:'09000000000',termsAccepted:true,privacyAccepted:true,paymentChannel:'GCash',referenceNumber:'DEMO',vehicle:'bus',passengers:[{name:'Demo',contact:'09000000000',packageId:'normal-bus'}],trips:[{date:'January 14, 2027',pickup:'SM North EDSA',seats:['C1']}],amountPaid:850,paymentPlan:'Full',paymentProof:{}};
const writesBefore=writes;run('createBooking_(submission)');backend.submission.requestId='B';run('createBooking_(submission)');
assert.equal(bookingRows.length,3);assert.equal(paymentRows.length,3);assert.equal(writes,writesBefore);
for(const row of bookingRows.slice(1)){const notes=JSON.parse(row[26]);assert.equal(notes.seatPolicy,'PREFERENCE');assert.equal(notes.trips[0].date,'January 14, 2027');assert.deepEqual(notes.trips[0].seats,['C1']);assert.equal(notes.passengers[0].name,'Demo');}
console.log('PASS: full booking creation saves two independent bus preference requests and payments for the same desired seat without any inventory mutation.');
