import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
for (const dir of ['build','apps-script']) for (const file of fs.readdirSync(path.join(root,dir)).filter(f=>/\.(js|gs)$/.test(f))) new vm.Script(fs.readFileSync(path.join(root,dir,file),'utf8'),{filename:file});
const context=vm.createContext({console,Date,Set,Utilities:{formatDate:()=> 'January 14, 2027'}});
vm.runInContext(fs.readFileSync(path.join(root,'apps-script/LaLaLakbay_Backend_Code.gs'),'utf8'),context);
const run=s=>vm.runInContext(s,context);
const body={email:'demo@example.com',fullName:'Demo Passenger',contact:'09000000000',termsAccepted:true,privacyAccepted:true,paymentChannel:'GCash',referenceNumber:'DEMO',vehicle:'bus',passengers:[{name:'Demo Passenger',contact:'09000000000',packageId:'normal-bus'}],trips:[{date:'January 14, 2027',pickup:'SM North EDSA',seats:['C1']}]};
context.sample=body;
run('validateBooking_(sample)');
assert.equal(run('calculateFare_("bus",normalizePassengers_(sample.passengers,sample),normalizeTrips_(sample.trips,sample))'),850);
context.van={...body,vehicle:'van',passengers:[{name:'Demo',contact:'09000000000',packageId:'vip-van',artistPreference:'SURPRISE_ME'}],trips:[{date:'January 14',pickup:'SM Bacoor',seats:['1']}]};
run('validateBooking_(van)');assert.equal(run('calculateFare_("van",normalizePassengers_(van.passengers,van),normalizeTrips_(van.trips,van))'),1500);
for (const change of [{email:'invalid'},{termsAccepted:false},{trips:[{date:'May 15, 2027',pickup:'SM MOA',seats:['C1']}]},{trips:[{date:'January 14',pickup:'SM Bacoor',seats:['C1']}]},{passengers:[{name:'Minor',minor:true,contact:'09000000000',packageId:'normal-bus'}]}]) {
  context.invalid={...body,...change};assert.throws(()=>run('validateBooking_(invalid)'));
}
assert.equal(run('sheetLiteral_("=IMPORTXML(1)")'),"'=IMPORTXML(1)");
const rows=[['Date','Seat','Type','Status'],['January 14, 2027','C1','PASSENGER','AVAILABLE'],['January 14, 2027','C2','PASSENGER','LOCKED'],['January 14, 2027','A1','PRIORITY','RESERVED'],['January 14, 2027','M1','VOLUNTEER','RESERVED']];
let writes=[];
context.mockSheet={getDataRange:()=>({getValues:()=>rows}),getRange:(...args)=>({setValues:values=>writes.push({args,values})})};
run('campaignSpreadsheet_=()=>({getSheetByName:()=>mockSheet});ensureVanInventory_=()=>{}');
run('lockSelectedSeats_("TEST","bus",normalizePassengers_(sample.passengers,sample),normalizeTrips_(sample.trips,sample),[{ticketId:"TEST-01",role:"PRIMARY"}],sample)');
assert.equal(writes.length,1);writes=[];
for(const seat of ['C2','A1','M1','UNKNOWN']){context.locked={...body,trips:[{...body.trips[0],seats:[seat]}]};assert.throws(()=>run('lockSelectedSeats_("TEST","bus",normalizePassengers_(locked.passengers,locked),normalizeTrips_(locked.trips,locked),[{ticketId:"TEST-01",role:"PRIMARY"}],locked)'));assert.equal(writes.length,0);}
context.partial={...body,passengers:[...body.passengers,...body.passengers],trips:[{...body.trips[0],seats:['C1','C2']}]};assert.throws(()=>run('lockSelectedSeats_("TEST","bus",normalizePassengers_(partial.passengers,partial),normalizeTrips_(partial.trips,partial),[{ticketId:"1"},{ticketId:"2"}],partial)'));assert.equal(writes.length,0);
const bookingRows=[Array(30).fill('')],paymentRows=[Array(22).fill('')];let failedPayment=false,released=0,emailCount=0;
const table=data=>({getLastRow:()=>data.length,getMaxColumns:()=>31,getDataRange:()=>({getValues:()=>data}),appendRow:r=>{if(data===paymentRows&&failedPayment)throw new Error('Simulated payment write failure');data.push(r);},getRange:(row,col,height=1)=>({getValue:()=> 'Companion Contact Numbers',clearContent:()=>data.splice(row-1,height),setValue:()=>{}})});
context.tables={Bookings:table(bookingRows),Payments:table(paymentRows)};
context.releaseMock=()=>released++;context.sendMock=()=>emailCount++;
run('campaignSpreadsheet_=()=>({getSheetByName:name=>tables[name]});saveProof_=()=>"private-proof";lockSelectedSeats_=()=>{};makeBookingReference_=()=>"FOB-LL-0001";makeReference_=()=>"PAY-DEMO";rebuildReviewSheets_=()=>{};buildEmailBooking_=()=>({});sendLaLaLakbayPendingEmail=sendMock;markBookingCell_=()=>{};releaseSeats_=releaseMock;');
context.submission={...body,requestId:'demo-request',amountPaid:250,paymentPlan:'Installment',paymentProof:{}};
failedPayment=true;assert.throws(()=>run('createBooking_(submission)'),/Simulated payment write failure/);assert.equal(bookingRows.length,1);assert.equal(released,1);assert.equal(emailCount,0);
failedPayment=false;assert.equal(run('createBooking_(submission)').paymentId,'PAY-DEMO');assert.equal(bookingRows.length,2);assert.equal(paymentRows.length,2);assert.equal(emailCount,1);
assert.equal(run('createBooking_(submission)').replayed,true);assert.equal(bookingRows.length,2);assert.equal(emailCount,1);
context.balanceBody={bookingRef:'FOB-LL-0001',email:'demo@example.com',amountPaid:250,paymentChannel:'GCash',referenceNumber:'DEMO'};
bookingRows[1][10]='CONFIRMED';assert.equal(run('submitBalance_(balanceBody)').replayed,true);assert.equal(paymentRows.length,2);
const build=path.join(root,'build');
for(const file of fs.readdirSync(build).filter(f=>f.endsWith('.html'))){const content=fs.readFileSync(path.join(build,file),'utf8');for(const [,url] of content.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(url))continue;assert.ok(fs.existsSync(path.resolve(build,url.split(/[?#]/)[0])),file+': missing '+url);}}
console.log('PASS: source parsing, fares, consent, campaign date, van-only routes, guardian requirements, formula escaping, occupied/priority/staff seats, all-or-nothing seat validation, failed-write rollback, booking/payment retry protection, and local links.');
