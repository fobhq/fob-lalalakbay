// BEGIN GENERATED ARTIST OPTIONS — source: build/festival-data.js
const LL_ARTIST_OPTIONS = [
  {
    "id": "olivia-dean",
    "name": "Olivia Dean"
  },
  {
    "id": "bini",
    "name": "BINI"
  },
  {
    "id": "udd",
    "name": "Up Dharma Down"
  },
  {
    "id": "lola-amour",
    "name": "Lola Amour"
  },
  {
    "id": "sunkissed-lola",
    "name": "SunKissed Lola"
  }
];
// END GENERATED ARTIST OPTIONS

/**
 * FANSONBOARD PH — LALALAKBAY SHUTTLE BACKEND
 * Bound to: FansOnBoard PH — LaLaLakbay Shuttle Operations
 * Event dates: January 14, 2027
 */

const LL = {
  dates: ['January 14, 2027'],
  due50: new Date('2026-11-14T23:59:59+08:00'),
  dueFull: new Date('2026-12-31T23:59:59+08:00'),
  lateFeePerDay: 100,
  proofFolder: 'FansOnBoard PH — LaLaLakbay Payment Proofs',
  noBus: ['SM Bacoor', 'SM Dasma', 'Rodriguez, Rizal'],
  packages: {
    bus: {
      'normal-bus': {name:'FOB RIDE', detail:'Shuttle Only', price:850},
      'bus-freebies': {name:'FOB FAN RIDE', detail:'Shuttle + Artist-Themed Fan Freebies', price:999, freebies:true},
      'bus-lounge': {name:'FOB VIP RIDE', detail:'Shuttle + Fan Freebies + 3-hour Cooling Lounge + LaLaLakbay Eco Bag', price:1250, freebies:true}
    },
    van: {
      'normal-van': {name:'FOB RIDE', detail:'Regular Van · 14 passengers · Shuttle Only', price:950},
      'vip-van': {name:'FOB FAN RIDE', detail:'VIP Van · 12 passengers · Fan Freebies + LaLaLakbay Eco Bag', price:1250, freebies:true}
    }
  },
  vanOverrides: {
    'SM Bacoor': {'normal-van':1100, 'vip-van':1500},
    'SM Dasma': {'normal-van':1100, 'vip-van':1500},
    'Rodriguez, Rizal': {'normal-van':1100, 'vip-van':1500}
  },
  prioritySeats: ['A1','A2','B1','B2','N1','N2'],
  volunteerSeats: ['M1','M2']
};

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const action = String(p.action || 'health').toLowerCase();
    if (action === 'availability') return json_(getAvailability_(p.date, p.vehicle));
    if (action === 'lookup') return json_(lookupBooking_(p.reference, p.email));
    if (action === 'config') return json_({ok:true, campaignId:'lalalakbay-2027', dates:LL.dates, due50:'November 14, 2026', dueFull:'December 31, 2026', bookingEnabled:bookingEnabled_(), lateFeePerDay:LL.lateFeePerDay});
    return json_({ok:true, campaignId:'lalalakbay-2027', service:'FansOnBoard PH LaLaLakbay Shuttle', status:'ready', bookingEnabled:bookingEnabled_()});
  } catch (err) {
    return json_({ok:false, error:err.message});
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    assertCampaignSheet_();
    if(!bookingEnabled_())throw new Error("Booking is not open yet.");
    const body = parseBody_(e);
    const action = String(body.action || 'booking').toLowerCase();
    if (action === 'booking') return json_(createBooking_(body));
    if (action === 'balance') return json_(submitBalance_(body));
    return json_({ok:false, error:'Unsupported action.'});
  } catch (err) {
    console.error(err && err.stack || err);
    return json_({ok:false, error:err.message || String(err)});
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function setupLaLaLakbayBackend() {
  assertCampaignSheet_();
  ensureBusInventory_();
  ensureVanInventory_();
  ensureAdminTrigger_();
  rebuildAllViews_();
  campaignSpreadsheet_().toast('LaLaLakbay backend is ready.', 'FansOnBoard PH', 8);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('LALALAKBAY SHUTTLE')
    .addItem('Refresh admin views', 'rebuildAllViews_')
    .addItem('Initialize / repair backend', 'setupLaLaLakbayBackend')
    .addItem('Release unconfirmed booking', 'releaseSelectedBooking')
    .addToUi();
}

function parseBody_(e) {
  const raw = e && e.postData && e.postData.contents;
  if (!raw) return (e && e.parameter) || {};
  try { return JSON.parse(raw); }
  catch (_) { throw new Error('Invalid request payload.'); }
}

function createBooking_(body) {
  validateBooking_(body);
  if(!clean_(body.requestId))throw new Error("A submission identifier is required.");
  const previous=findRequest_(body.requestId);if(previous)return previous;
  const ss = campaignSpreadsheet_();
  const bookingRef = makeBookingReference_();
  const vehicle = String(body.vehicle).toLowerCase();
  const passengers = normalizePassengers_(body.passengers, body);
  const trips = normalizeTrips_(body.trips, body);
  const addOnInterest = normalizeAddOnInterest_(body.addOnInterest, passengers);
  const totalFare = calculateFare_(vehicle, passengers, trips);
  const amountPaid = moneyNumber_(body.amountPaid);
  const nowForPlan=new Date();
  const minimum = String(body.paymentPlan).toLowerCase().indexOf('install') >= 0 ? (nowForPlan>LL.dueFull?totalFare:nowForPlan>LL.due50?Math.ceil(totalFare*.5):Math.min(250 * passengers.length, totalFare)) : totalFare;
  if (amountPaid < minimum) throw new Error('Submitted payment is below the required amount.');
  if (amountPaid > totalFare) throw new Error('Submitted payment is higher than the total fare.');

  const tickets = passengers.map(function(p, i) {
    return {ticketId:bookingRef + '-' + pad_(i + 1, 2), name:p.name, role:i === 0 ? 'PRIMARY' : 'COMPANION', packageId:p.packageId};
  });
  const proofUrl = saveProof_(body.paymentProof, bookingRef + '-INITIAL');
  const previousBookingRows=ss.getSheetByName('Bookings').getLastRow(),previousPaymentRows=ss.getSheetByName('Payments').getLastRow();
  let paymentId;
  try {
  // Bus selections are requests only. Van inventory behavior remains unchanged.
  lockSelectedSeats_(bookingRef, vehicle, passengers, trips, tickets, body, vehicle === 'bus');
  paymentId = makeReference_('PAY');
  const now = new Date();
  const notes = {
    requestId:clean_(body.requestId),
    vehicle:vehicle,
    seatPolicy:vehicle === 'bus' ? 'PREFERENCE' : 'INVENTORY',
    passengers:passengers,
    addOnInterest:addOnInterest,
    trips:trips,
    prioritySeating:Boolean(body.priorityRequest),
    priorityReasons:body.priorityReasons || [],
    coolingLoungePassengers:passengers.filter(function(p){return p.packageId === 'bus-lounge';}).map(function(p){return p.name;})
  };

  const bookingSheet = ss.getSheetByName('Bookings');
  if (bookingSheet.getMaxColumns() < 31) bookingSheet.insertColumnsAfter(bookingSheet.getMaxColumns(), 31 - bookingSheet.getMaxColumns());
  if (clean_(bookingSheet.getRange(1, 30).getValue()) !== 'Companion Contact Numbers') bookingSheet.getRange(1, 30).setValue('Companion Contact Numbers');
  if(clean_(bookingSheet.getRange(1,31).getValue())!=='Artist Preferences per Passenger')bookingSheet.getRange(1,31).setValue('Artist Preferences per Passenger');
  bookingSheet.appendRow([
    bookingRef, now, passengers[0].name, clean_(body.email), clean_(body.contact), clean_(body.telegram), clean_(body.facebook),
    passengers.length > 1 ? 'Group' : 'Individual', passengers.length, trips.length, 'PENDING VERIFICATION', 'PENDING VERIFICATION',
    clean_(body.paymentPlan), totalFare, 0, totalFare, passengers.some(function(p){return p.minor;}) ? 'Yes' : 'No',
    [clean_(body.guardianName), clean_(body.guardianNumber)].filter(Boolean).join(' · '), 'YES', 'YES', clean_(body.paymentChannel),
    clean_(body.referenceNumber), proofUrl, 'NO', 'NO', 'NO', JSON.stringify(notes), tickets.map(function(t){return t.ticketId;}).join(', '),
    passengers.slice(1).map(function(p){return p.name;}).join(', '),
    passengers.slice(1).map(function(p){return p.contact;}).join(', '),
    passengers.filter(function(p){return p.artistPreference;}).map(function(p){return p.name+' / '+p.packageName+': '+p.artistPreferenceLabel;}).join('\n')
  ].map(sheetLiteral_));

  ss.getSheetByName('Payments').appendRow([
    paymentId, bookingRef, passengers[0].name, 'INITIAL PAYMENT', clean_(body.paymentChannel), minimum, amountPaid,
    clean_(body.referenceNumber), proofUrl, now, 'FOR VERIFICATION', '', '', clean_(body.paymentPlan), '', '', '', '', '', 0, 'NO', 'NO'
  ].map(sheetLiteral_));

  } catch(err) {
    const b=ss.getSheetByName('Bookings'),p=ss.getSheetByName('Payments');
    if(b.getLastRow()>previousBookingRows)b.getRange(previousBookingRows+1,1,b.getLastRow()-previousBookingRows,31).clearContent();
    if(p.getLastRow()>previousPaymentRows)p.getRange(previousPaymentRows+1,1,p.getLastRow()-previousPaymentRows,22).clearContent();
    releaseSeats_(bookingRef);throw err;
  }
  try{rebuildReviewSheets_();}catch(err){console.error('Admin view refresh: '+err.message);}
  const emailBooking = buildEmailBooking_(bookingRef);
  try { sendLaLaLakbayPendingEmail(emailBooking); markBookingCell_(bookingRef, 24, 'YES'); } catch (err) { console.error('Pending email: ' + err.message); }
  return {ok:true, bookingRef:bookingRef, paymentId:paymentId, totalFare:totalFare, amountSubmitted:amountPaid, remainingBalance:totalFare};
}

function submitBalance_(body) {
  const ref = clean_(body.bookingRef || body.reference).toUpperCase();
  const email = clean_(body.email).toLowerCase();
  const booking = findBooking_(ref);
  if (!booking) throw new Error('Booking reference not found.');
  if (clean_(booking.row[3]).toLowerCase() !== email) throw new Error('Email does not match the booking.');
  const remaining = moneyNumber_(booking.row[15]);
  if (remaining <= 0) throw new Error('This booking is already fully paid.');
  const amount = moneyNumber_(body.amountPaid || body.amount);
  const duplicate=campaignSpreadsheet_().getSheetByName('Payments').getDataRange().getValues().slice(1).find(p=>clean_(p[1])===ref && clean_(p[4])===clean_(body.paymentChannel) && clean_(p[7])===clean_(body.referenceNumber));
  if(duplicate){if(moneyNumber_(duplicate[6])!==amount)throw new Error('This payment reference was already submitted with a different amount.');return {ok:true,bookingRef:ref,paymentId:duplicate[0],replayed:true};}
  if (amount <= 0 || amount>remaining+outstandingLateFee_(ref,remaining)) throw new Error('Enter an amount within the remaining total due.');
  if(clean_(booking.row[10])!=='CONFIRMED')throw new Error('Initial payment must be verified before a balance submission.');
  if(['GCash','Maya','Bank Transfer'].indexOf(clean_(body.paymentChannel))<0 || !clean_(body.referenceNumber))throw new Error('Payment details are required.');
  const lateFee = outstandingLateFee_(ref,remaining);
  const proofUrl = saveProof_(body.paymentProof, ref + '-BALANCE');
  const paymentId = makeReference_('PAY');
  campaignSpreadsheet_().getSheetByName('Payments').appendRow([
    paymentId, ref, booking.row[2], 'BALANCE', clean_(body.paymentChannel), remaining + lateFee, amount,
    clean_(body.referenceNumber), proofUrl, new Date(), 'FOR VERIFICATION', '', '', 'Balance payment', '', '', '', '', '', Math.min(amount,lateFee), 'NO', 'NO'
  ].map(sheetLiteral_));
  try{rebuildReviewSheets_();}catch(err){console.error(err.message);}
  return {ok:true, bookingRef:ref, paymentId:paymentId, amountSubmitted:amount, verificationStatus:'FOR VERIFICATION'};
}

function lookupBooking_(reference, email) {
  const ref = clean_(reference).toUpperCase();
  const booking = findBooking_(ref);
  if (!booking || clean_(booking.row[3]).toLowerCase() !== clean_(email).toLowerCase()) return {ok:false, error:'Booking not found.'};
  const notes = parseJson_(booking.row[26], {});
  return {
    ok:true, campaignId:'lalalakbay-2027', bookingRef:ref, passenger:booking.row[2], passengerCount:booking.row[8], paymentStatus:booking.row[11],
    totalFare:moneyNumber_(booking.row[13]), totalPaid:moneyNumber_(booking.row[14]), remainingBalance:moneyNumber_(booking.row[15]),
    lateFee:outstandingLateFee_(ref,moneyNumber_(booking.row[15])), totalDue:moneyNumber_(booking.row[15]) + outstandingLateFee_(ref,moneyNumber_(booking.row[15])), vehicle:notes.vehicle || '', trips:notes.trips || [],
    packages:(notes.passengers || []).map(function(p){return p.packageName || p.packageId;})
  };
}

function validateBooking_(body) {
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean_(body.email)) || !clean_(body.fullName))throw new Error('A valid passenger name and email are required.');
  if(body.termsAccepted!==true || body.privacyAccepted!==true)throw new Error('Terms and privacy consent are required.');
  if(['GCash','Maya','Bank Transfer'].indexOf(clean_(body.paymentChannel))<0 || !clean_(body.referenceNumber))throw new Error('Payment channel and reference are required.');
  const vehicle = clean_(body.vehicle).toLowerCase();
  if (!LL.packages[vehicle]) throw new Error('Invalid vehicle type.');
  const passengers = normalizePassengers_(body.passengers, body);
  if (!passengers.length || passengers.length > 5) throw new Error('Choose 1 to 5 passenger slots.');
  const trips = normalizeTrips_(body.trips, body);
  if(trips.length!==1)throw new Error('Choose January 14, 2027 only.');
  if(passengers.some(function(p){return p.minor;}) && (!clean_(body.guardianName)||!clean_(body.guardianNumber)))throw new Error('Guardian contact details are required for minors.');
  if(passengers.some(function(p){return !p.name || !p.contact;}))throw new Error('Every passenger requires a name and contact number.');
  trips.forEach(function(t) {
    if (LL.dates.indexOf(t.date) < 0) throw new Error('Invalid concert date.');
    if (vehicle === 'bus' && LL.noBus.indexOf(t.pickup) >= 0) throw new Error(t.pickup + ' is van-only.');
    if(['SM MOA','SM North EDSA','Araneta Cubao','One Ayala','SM Megamall','SM Fairview','Rodriguez, Rizal','SM Bacoor','SM Dasma'].indexOf(t.pickup)<0)throw new Error('Invalid pickup point.');
    if(new Set(t.seats).size!==t.seats.length)throw new Error('Each passenger must have a different seat.');
    if (t.seats.length !== passengers.length) throw new Error('Select one seat per passenger for ' + t.date + '.');
  });
}

function artistPreferenceLabel_(value) {
  if(value==='SURPRISE_ME')return 'Surprise Me! 🎁';
  const artist=LL_ARTIST_OPTIONS.find(function(a){return a.id===value;});return artist?artist.name:'';
}
function normalizeArtistPreference_(value,eligible) {
  if(!eligible)return {artistPreference:'',artistPreferenceLabel:''};
  const id=clean_(value),label=artistPreferenceLabel_(id);
  if(!label)throw new Error('Choose an announced artist or Surprise Me for every passenger receiving freebies.');
  return {artistPreference:id,artistPreferenceLabel:label};
}

function normalizePassengers_(list, body) {
  const raw = Array.isArray(list) ? list : [{name:body.fullName, packageId:body.packageId || 'normal-bus'}];
  const vehicle = clean_(body.vehicle).toLowerCase();
  return raw.map(function(p, i) {
    const packageId = clean_(p.packageId);
    const def = LL.packages[vehicle] && LL.packages[vehicle][packageId];
    if (!def) throw new Error('Invalid package selection for passenger ' + (i + 1) + '.');
    const preference=normalizeArtistPreference_(p.artistPreference,Boolean(def.freebies));
    return Object.assign({name:clean_(p.name || (i === 0 ? body.fullName : '')), contact:clean_(p.contact || p.contactNumber || (i === 0 ? body.contact : '')), minor:Boolean(p.minor), packageId:packageId, packageName:def.name, packageDetail:def.detail},preference);
  });
}

function normalizeTrips_(list, body) {
  const raw = Array.isArray(list) ? list : [];
  return raw.map(function(t) {
    return {date:normalizeDate_(t.date), pickup:clean_(t.pickup), time:clean_(t.time), seats:(t.seats || []).map(function(s){return clean_(s).toUpperCase();})};
  });
}

function calculateFare_(vehicle, passengers, trips) {
  return passengers.reduce(function(total, passenger) {
    return total + trips.reduce(function(sum, trip) {
      const def = LL.packages[vehicle][passenger.packageId];
      const override = vehicle === 'van' && LL.vanOverrides[trip.pickup] && LL.vanOverrides[trip.pickup][passenger.packageId];
      return sum + (override || def.price);
    }, 0);
  }, 0);
}

// Interest only: never used in fare calculation or inventory reservation.
function normalizeAddOnInterest_(input, passengers) {
  if(input && (typeof input !== 'object' || Array.isArray(input)))throw new Error('Invalid add-on interest.');
  input=input||{};
  const included=passengers.filter(function(p){return p.packageId==='bus-lounge';}).length;
  function choice(value, allowIncluded) {
    const key=clean_(value)||'UNSPECIFIED';
    if(['UNSPECIFIED','INTERESTED','MAYBE','NOT_NOW'].indexOf(key)<0 && !(allowIncluded && key==='INCLUDED'))throw new Error('Invalid add-on interest choice.');
    return key;
  }
  const allIncluded=passengers.length>0 && included===passengers.length;
  return {lounge:allIncluded?'INCLUDED':choice(input.lounge,false),meals:choice(input.meals,false),loungeIncludedCount:included};
}

function lockSelectedSeats_(bookingRef, vehicle, passengers, trips, tickets, body, preferenceOnly) {
  const sheet = campaignSpreadsheet_().getSheetByName('Seat_Inventory');
  if (vehicle === 'van') ensureVanInventory_();
  const values = sheet.getDataRange().getValues();
  const byKey = {};
  for (let r = 1; r < values.length; r++) byKey[normalizeDate_(values[r][0]) + '|' + clean_(values[r][1])] = r + 1;
  const priorityAllowed = Boolean(body.priorityRequest) && Array.isArray(body.priorityReasons) && body.priorityReasons.length > 0;
  const updates = [];
  trips.forEach(function(trip) {
    trip.seats.forEach(function(rawSeat, i) {
      const storedSeat = vehicle === 'van' ? 'VAN-' + rawSeat.replace(/^VAN-/, '') : rawSeat;
      const rowNum = byKey[trip.date + '|' + storedSeat];
      if (!rowNum) throw new Error('Seat ' + rawSeat + ' is unavailable for ' + trip.date + '.');
      const row = values[rowNum - 1];
      const status = clean_(row[3]).toUpperCase();
      const isPriority = LL.prioritySeats.indexOf(storedSeat) >= 0;
      if (LL.volunteerSeats.indexOf(storedSeat) >= 0) throw new Error('Seat ' + rawSeat + ' is reserved for a volunteer.');
      if (isPriority && !priorityAllowed) throw new Error('Priority eligibility is required for seat ' + rawSeat + '.');
      if (status !== 'AVAILABLE' && !(isPriority && status === 'RESERVED')) throw new Error('Seat ' + rawSeat + ' was just taken. Please choose another seat.');
      updates.push({row:rowNum, values:['LOCKED', bookingRef, passengers[i].name, trip.pickup, 'PENDING VERIFICATION', 'PENDING VERIFICATION', new Date(), new Date(), vehicle.toUpperCase(), tickets[i].ticketId, tickets[i].role]});
    });
  });
  if (preferenceOnly) return; // Validate all preferences without any seat inventory writes.
  updates.forEach(function(u) {
    sheet.getRange(u.row, 4, 1, 11).setValues([[u.values[0],u.values[1],u.values[2],u.values[3],u.values[4],u.values[5],u.values[6],u.values[7],u.values[8],u.values[9],u.values[10]].map(sheetLiteral_)]);
  });
}

function getAvailability_(date, vehicle) {
  const target = normalizeDate_(date);
  const kind = clean_(vehicle || 'bus').toLowerCase();
  const rows = campaignSpreadsheet_().getSheetByName('Seat_Inventory').getDataRange().getDisplayValues().slice(1);
  const items = rows.filter(function(r){return normalizeDate_(r[0]) === target && (kind === 'van' ? /^VAN-/.test(r[1]) : !/^VAN-/.test(r[1]));});
  return {ok:true, campaignId:'lalalakbay-2027', date:target, vehicle:kind, seats:items.map(function(r){return {seat:kind === 'van' ? r[1].replace('VAN-','') : r[1], type:r[2], status:r[3]};})};
}

function onAdminEdit(e) {
  if (!e || !e.range || e.source.getId()!==campaignSpreadsheet_().getId()) return;
  const sheet = e.range.getSheet();
  const name = sheet.getName();
  let paymentId = '';
  let decision = clean_(e.value).toUpperCase();
  if (['VERIFIED','NOT VERIFIED','REJECTED'].indexOf(decision) < 0) return;
  if (name === 'Payments' && e.range.getColumn() === 11) paymentId = clean_(sheet.getRange(e.range.getRow(), 1).getValue());
  if (name === 'PAYMENT REVIEW' && e.range.getColumn() === 11) paymentId = clean_(sheet.getRange(e.range.getRow(), 17).getValue());
  if (name === 'BALANCE REVIEW' && e.range.getColumn() === 14) paymentId = clean_(sheet.getRange(e.range.getRow(), 13).getValue());
  if (!paymentId) return;
  const adminLock=LockService.getScriptLock();adminLock.waitLock(30000);
  try{
    const paySheet = campaignSpreadsheet_().getSheetByName('Payments');
    const data = paySheet.getDataRange().getValues();
    for (let r = 1; r < data.length; r++) if (clean_(data[r][0]) === paymentId) {
      const booking=findBooking_(data[r][1]);
      if(booking && clean_(booking.row[10])==='CANCELLED'){paySheet.getRange(r+1,11).setValue('NOT VERIFIED');throw new Error('Released bookings require a new seat assignment before verification.');}
      paySheet.getRange(r + 1, 11).setValue(decision === 'REJECTED' ? 'NOT VERIFIED' : decision);
      paySheet.getRange(r + 1, 12).setValue(Session.getActiveUser().getEmail());
      paySheet.getRange(r + 1, 13).setValue(new Date());
      processPaymentDecision_(r + 1);
      break;
    }
  }finally{adminLock.releaseLock();}
}

function processPaymentDecision_(paymentRow) {
  const ss = campaignSpreadsheet_();
  const pSheet = ss.getSheetByName('Payments');
  const payment = pSheet.getRange(paymentRow, 1, 1, 22).getValues()[0];
  const ref = clean_(payment[1]);
  const status = clean_(payment[10]).toUpperCase();
  const booking = findBooking_(ref);
  if (!booking) return;
  if(clean_(booking.row[10])==='CANCELLED')throw new Error('This booking was released. Do not verify its payment without a new seat assignment.');
  if (status === 'VERIFIED') {
    const all = pSheet.getDataRange().getValues().slice(1).filter(function(r){return clean_(r[1]) === ref && clean_(r[10]).toUpperCase() === 'VERIFIED';});
    const paid = all.reduce(function(sum,r){return sum + Math.max(0,moneyNumber_(r[6])-moneyNumber_(r[19]));}, 0);
    const total = moneyNumber_(booking.row[13]);
    const remaining = Math.max(total - paid, 0);
    const paymentStatus = remaining <= 0 ? 'PAID' : 'PARTIALLY PAID';
    const bSheet = ss.getSheetByName('Bookings');
    bSheet.getRange(booking.rowNum, 11, 1, 6).setValues([['CONFIRMED', paymentStatus, booking.row[12], total, paid, remaining]]);

    const inv = ss.getSheetByName('Seat_Inventory');
    const invData = inv.getDataRange().getValues();
    for (let r = 1; r < invData.length; r++) if (clean_(invData[r][4]) === ref) {
      inv.getRange(r + 1, 4).setValue('LOCKED');
      inv.getRange(r + 1, 8).setValue('CONFIRMED');
      inv.getRange(r + 1, 9).setValue(paymentStatus);
      inv.getRange(r + 1, 11).setValue(new Date());
    }
    try { if(clean_(payment[21])!=='YES'){sendLaLaLakbayConfirmedEmail(buildEmailBooking_(ref)); pSheet.getRange(paymentRow, 22).setValue('YES');bSheet.getRange(booking.rowNum,25).setValue('YES');} } catch (err) { console.error('Confirmed email: ' + err.message); }
  } else if (status === 'NOT VERIFIED') {
    try {if(clean_(payment[20])!=='YES'){sendLaLaLakbayCorrectionEmail(buildEmailBooking_(ref));pSheet.getRange(paymentRow,21).setValue('YES');}}catch(err){console.error(err.message);}
  }
  rebuildAllViews_();
}

function rebuildAllViews_() {
  ensureVanInventory_();
  rebuildReviewSheets_();
  rebuildPassengerBalances_();
  rebuildMasterlists_();
  rebuildSeatMapNames_();
  ensureDashboardPackageSummary_();
}

function rebuildReviewSheets_() {
  const ss = campaignSpreadsheet_();
  const payments = ss.getSheetByName('Payments').getDataRange().getValues().slice(1);
  const bookings = ss.getSheetByName('Bookings').getDataRange().getValues().slice(1);
  const bookingMap = {}; bookings.forEach(function(r){bookingMap[clean_(r[0])] = r;});
  const initial = [], balance = [];
  payments.forEach(function(p, i) {
    if (!clean_(p[0])) return;
    const b = bookingMap[clean_(p[1])] || [];
    const notes = parseJson_(b[26], {});
    const tripText = (notes.trips || []).map(function(t){return t.date + ' · ' + (notes.seatPolicy === 'PREFERENCE' ? 'DESIRED SEATS (NOT FINAL): ' : '') + (t.seats || []).join(', ') + ' · ' + t.pickup;}).join('\n');
    const isBalance = /BALANCE|INSTALLMENT 2/i.test(clean_(p[3]));
    if (isBalance) balance.push([p[1],p[2],b[15]||0,p[19]||0,moneyNumber_(b[15])+moneyNumber_(p[19]),p[6],p[8],p[14],p[17],p[16],p[7],p[9],p[0],p[10],b[11],b[14],b[15],b[3],p[20],p[21]]);
    else initial.push([initial.length+1,b[1],p[1],p[2],tripText,p[3],p[5],p[6],p[7],p[8],p[10],b[10],b[11],b[15],p[4],p[9],p[0]]);
  });
  writeView_(ss.getSheetByName('PAYMENT REVIEW'), 4, 17, initial);
  writeView_(ss.getSheetByName('BALANCE REVIEW'), 4, 20, balance);
}

function rebuildPassengerBalances_() {
  const ss = campaignSpreadsheet_();
  const rows = ss.getSheetByName('Bookings').getDataRange().getValues().slice(1).filter(function(r){return clean_(r[0]) && clean_(r[10]) === 'CONFIRMED' && moneyNumber_(r[15]) > 0;}).map(function(r){
    const notes = parseJson_(r[26], {});
    const trips = (notes.trips || []).map(function(t){return t.date + ' · ' + (notes.seatPolicy === 'PREFERENCE' ? 'DESIRED SEATS (NOT FINAL): ' : '') + (t.seats || []).join(', ') + ' · ' + t.pickup;}).join('\n');
    const fee = outstandingLateFee_(r[0],moneyNumber_(r[15]));
    return [r[0],r[2],r[3],r[4],trips,r[13],r[14],r[15],'December 31, 2026',r[11],r[24],r[26],fee,moneyNumber_(r[15])+fee];
  });
  writeView_(ss.getSheetByName('Passenger Balances'), 4, 14, rows);
}

function rebuildMasterlists_() {
  const ss = campaignSpreadsheet_();
  const bookings = ss.getSheetByName('Bookings').getDataRange().getValues().slice(1);
  const bookingMap = {}; bookings.forEach(function(r){bookingMap[clean_(r[0])] = r;});
  const inv = ss.getSheetByName('Seat_Inventory').getDataRange().getValues().slice(1).filter(function(r){return clean_(r[7]) === 'CONFIRMED';});
  const all = inv.map(function(r){
    const b = bookingMap[clean_(r[4])] || [];
    const notes = parseJson_(b[26], {}), ticketIds = clean_(b[27]).split(',').map(function(id){return clean_(id);}).filter(Boolean);
    const passengerIndex = ticketIds.indexOf(clean_(r[12])), passenger = passengerIndex >= 0 ? (notes.passengers || [])[passengerIndex] || {} : {};
    const passengerContact = clean_(passenger.contact) || clean_(b[4]);
    return [r[0],String(r[1]).replace(/^VAN-/,''),r[12],r[4],r[5],r[13],b[8],b[2],passengerContact,b[3],b[5],r[6],'TBA',r[7],r[8],b[15],b[16],b[17],b[25],passenger.packageName || passenger.packageId || ''];
  });
  all.sort(masterlistSort_);
  writeMasterlistView_(ss.getSheetByName('Masterlist'), all);
  LL.dates.forEach(function(date) {
    const suffix = '14';
    const rows = all.filter(function(r){return normalizeDate_(r[0]) === date;}).sort(masterlistSort_);
    writeMasterlistView_(ss.getSheetByName('MASTERLIST JAN ' + suffix), rows);
    const attendanceSheet=ss.getSheetByName('ATTENDANCE JAN ' + suffix);
    const savedAttendance={};
    if(attendanceSheet)attendanceSheet.getDataRange().getValues().slice(6).forEach(r=>{if(r[0])savedAttendance[r[0]]=r.slice(7,11);});
    const attendance = rows.map(function(r){const checks=savedAttendance[r[2]]||[false,false,false,false];return [r[2],r[3],r[4],r[5],r[6],r[1],r[11],...checks,r[7],r[8],r[19]];});
    writeView_(attendanceSheet, 7, 14, attendance);
  });
}

function masterlistSort_(a, b) {
  const date = normalizeDate_(a[0]).localeCompare(normalizeDate_(b[0]));
  if (date) return date;
  const booking = clean_(a[3]).localeCompare(clean_(b[3]));
  if (booking) return booking;
  const role = (clean_(a[5]) === 'PRIMARY' ? 0 : 1) - (clean_(b[5]) === 'PRIMARY' ? 0 : 1);
  if (role) return role;
  return clean_(a[2]).localeCompare(clean_(b[2]));
}

function writeMasterlistView_(sheet, rows) {
  if (!sheet) return;
  const startRow = 4, columns = 20;
  sheet.getRange(3, 20).setValue('Package');
  const capacity = Math.max(sheet.getMaxRows() - startRow + 1, 1);
  const dataRange = sheet.getRange(startRow, 1, capacity, columns);
  dataRange.breakApart();
  dataRange.clearContent();
  if (!rows.length) return;
  sheet.getRange(startRow, 1, rows.length, columns).setValues(rows.map(r=>r.map(sheetLiteral_)));

  // Keep passenger-specific details separate. Merge only booking-level details
  // so each group is visually distinct without hiding individual packages,
  // names, contacts, ticket IDs, roles, or seats.
  const groupColumns = [1,4,7,8,10,11,12,13,14,15,16,18,19];
  let first = 0;
  while (first < rows.length) {
    const key = normalizeDate_(rows[first][0]) + '|' + clean_(rows[first][3]);
    let last = first + 1;
    while (last < rows.length && normalizeDate_(rows[last][0]) + '|' + clean_(rows[last][3]) === key) last++;
    if (last - first > 1) {
      groupColumns.forEach(function(column) {
        sheet.getRange(startRow + first, column, last - first, 1).mergeVertically();
      });
    }
    first = last;
  }
  sheet.getRange(startRow, 1, rows.length, columns).setVerticalAlignment('middle');
}

function rebuildSeatMapNames_() {
  const placements = [];
  const seatRows = [
    {nameRow:7, seatRow:9, seats:[['A','A1'],['D','A2']]},
    {nameRow:11, seatRow:13, seats:[['A','B1'],['D','B2'],['H','N1'],['K','N2']]},
    {nameRow:15, seatRow:17, seats:[['A','C1'],['D','C2'],['H','O1'],['K','O2']]},
    {nameRow:19, seatRow:21, seats:[['A','D1'],['D','D2'],['H','P1'],['K','P2']]},
    {nameRow:23, seatRow:25, seats:[['A','E1'],['D','E2'],['H','Q1'],['K','Q2']]},
    {nameRow:27, seatRow:29, seats:[['A','F1'],['D','F2'],['H','R1'],['K','R2']]},
    {nameRow:31, seatRow:33, seats:[['A','G1'],['D','G2'],['H','S1'],['K','S2']]},
    {nameRow:35, seatRow:37, seats:[['A','H1'],['D','H2'],['H','T1'],['K','T2']]},
    {nameRow:39, seatRow:41, seats:[['A','I1'],['D','I2'],['H','U1'],['K','U2']]},
    {nameRow:43, seatRow:45, seats:[['A','J1'],['D','J2'],['H','V1'],['K','V2']]},
    {nameRow:47, seatRow:49, seats:[['A','K1'],['D','K2'],['H','W1'],['K','W2']]},
    {nameRow:54, seatRow:56, seats:[['A','L1'],['D','L2'],['G','L3'],['J','L4'],['M','L5']]}
  ];
  seatRows.forEach(function(group) {
    group.seats.forEach(function(item) { placements.push({cell:item[0] + group.nameRow, seat:item[1]}); });
  });

  const ss = campaignSpreadsheet_();
  LL.dates.forEach(function(date) {
    const day = 14;
    const sheet = ss.getSheetByName('SEATS JAN ' + day);
    if (!sheet) return;
    placements.forEach(function(item) {
      const formula = '=IFERROR(INDEX(FILTER(Seat_Inventory!$F$2:$F$1000,((Seat_Inventory!$A$2:$A$1000=DATE(2027,1,' + day + '))+(Seat_Inventory!$A$2:$A$1000="' + date + '"))>0,Seat_Inventory!$B$2:$B$1000="' + item.seat + '"),1),"")';
      sheet.getRange(item.cell).setFormula(formula);
    });
    sheet.getRangeList(placements.map(function(item){return item.cell;}))
      .setFontSize(9).setFontWeight('bold').setWrap(true).setHorizontalAlignment('center').setVerticalAlignment('middle');
  });
}

function ensureDashboardPackageSummary_() {
  const sheet = campaignSpreadsheet_().getSheetByName('Dashboard');
  if (!sheet) return;
  sheet.getRange('K10:M10').breakApart().merge().setValue('BOOKED SLOTS BY PACKAGE');
  sheet.getRange('K11:M14').setValues([
    ['FOB RIDE', packageCountFormula_(['normal-bus','normal-van']), 'slots'],
    ['FOB FAN RIDE', packageCountFormula_(['bus-freebies','vip-van']), 'slots'],
    ['FOB VIP RIDE', packageCountFormula_(['bus-lounge']), 'slots'],
    ['TOTAL PASSENGER SLOTS', '=SUM(L11:L13)', 'slots']
  ]);
  sheet.getRange('K10:M10')
    .setBackground('#151E43').setFontColor('#F7A3D8').setFontFamily('Montserrat')
    .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('K11:M14')
    .setBackground('#F9F2E5').setFontColor('#080304').setFontFamily('Montserrat')
    .setVerticalAlignment('middle').setWrap(true);
  sheet.getRange('L11:L14').setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange('M11:M14').setHorizontalAlignment('left');
  sheet.getRange('K14:M14').setFontWeight('bold').setBackground('#F2DEC1');
  sheet.getRange('K10:M14').setBorder(true,true,true,true,true,true,'#8A633D',SpreadsheetApp.BorderStyle.SOLID);
}

function packageCountFormula_(packageIds) {
  const parts = packageIds.map(function(id) {
    const token = '"packageId":"' + id + '"';
    return '(LEN(Bookings!$AA$2:$AA$998)-LEN(SUBSTITUTE(Bookings!$AA$2:$AA$998,"' + token.replace(/"/g,'""') + '","")))/' + token.length;
  });
  return '=SUM(ARRAYFORMULA(IF(Bookings!$K$2:$K$998="CONFIRMED",' + parts.join('+') + ',0)))';
}

function writeView_(sheet, startRow, columns, rows) {
  if (!sheet) return;
  const capacity = Math.max(sheet.getMaxRows() - startRow + 1, 1);
  sheet.getRange(startRow, 1, capacity, columns).clearContent();
  if (rows.length) sheet.getRange(startRow, 1, rows.length, columns).setValues(rows.map(function(r){return r.slice(0,columns).concat(Array(Math.max(0,columns-r.length)).fill('')).map(sheetLiteral_);}));
}

function ensureVanInventory_() {
  const sheet = campaignSpreadsheet_().getSheetByName('Seat_Inventory');
  const rows = sheet.getDataRange().getDisplayValues();
  const existing = {}; for (let i=1;i<rows.length;i++) existing[normalizeDate_(rows[i][0])+'|'+rows[i][1]]=true;
  const add = [];
  LL.dates.forEach(function(date){for(let n=1;n<=15;n++){const seat='VAN-'+n;if(!existing[date+'|'+seat])add.push([date,seat,'VAN','AVAILABLE','','','','','','','','VIP/Regular van seat','','']);}});
  if(add.length)sheet.getRange(sheet.getLastRow()+1,1,add.length,14).setValues(add);
}

function ensureAdminTrigger_() {
  const ss = campaignSpreadsheet_();
  const exists = ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='onAdminEdit';});
  if (!exists) ScriptApp.newTrigger('onAdminEdit').forSpreadsheet(ss).onEdit().create();
}

function buildEmailBooking_(ref) {
  const found = findBooking_(ref); if (!found) throw new Error('Booking not found.');
  const r = found.row, notes = parseJson_(r[26], {});
  const payments=campaignSpreadsheet_().getSheetByName('Payments').getDataRange().getValues().slice(1).filter(function(p){return clean_(p[1])===ref;});
  const submitted=payments.reduce(function(n,p){return n+moneyNumber_(p[6]);},0);
  return {email:r[3],fullName:r[2],bookingRef:r[0],vehicle:notes.vehicle,seatPolicy:notes.seatPolicy||'INVENTORY',passengerCount:r[8],packageSelection:(notes.passengers||[]).map(function(p){return p.name+': '+p.packageName;}).join(' · '),paymentPlan:r[12],paymentChannel:r[20],paymentReference:r[21],totalFare:r[13],amountSubmitted:submitted,totalPaid:r[14],remainingBalance:r[15],paymentStatus:r[11],trips:notes.trips||[],addOnInterest:notes.addOnInterest||null,artistPreferences:(notes.passengers||[]).filter(function(p){return p.artistPreference;}).map(function(p){return {name:p.name,packageName:p.packageName,artistPreference:p.artistPreference,label:p.artistPreferenceLabel||artistPreferenceLabel_(p.artistPreference)};}),passengerTickets:(r[27]||'').toString().split(', ').filter(Boolean).map(function(id,i){return {ticketId:id,name:(notes.passengers||[])[i]?(notes.passengers||[])[i].name:'Passenger',role:i?'COMPANION':'PRIMARY'};})};
}

function findBooking_(ref) {
  const sheet = campaignSpreadsheet_().getSheetByName('Bookings');
  const data = sheet.getDataRange().getValues();
  for (let r=1;r<data.length;r++) if (clean_(data[r][0]).toUpperCase() === clean_(ref).toUpperCase()) return {sheet:sheet,rowNum:r+1,row:data[r]};
  return null;
}

function markBookingCell_(ref, column, value) { const b=findBooking_(ref); if(b)b.sheet.getRange(b.rowNum,column).setValue(value); }

function saveProof_(proof, prefix) {
  if(!proof || !proof.data)throw new Error('Payment proof is required.');
  if(['image/jpeg','image/png','image/webp','application/pdf'].indexOf(proof.mimeType)<0)throw new Error('Unsupported payment proof format.');
  const bytes = Utilities.base64Decode(String(proof.data).replace(/^data:[^;]+;base64,/,''));
  if(bytes.length>4*1024*1024)throw new Error('Payment proof must be 4 MB or smaller.');
  const type = clean_(proof.mimeType || 'application/octet-stream');
  const name = prefix + '-' + clean_(proof.name || 'proof').replace(/[^a-z0-9._-]/gi,'_');
  const folders = DriveApp.getFoldersByName(LL.proofFolder);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(LL.proofFolder);
  return folder.createFile(Utilities.newBlob(bytes,type,name)).getUrl();
}

function lateFee_() { const now=new Date(); if(now<=LL.dueFull)return 0; return Math.ceil((now-LL.dueFull)/86400000)*LL.lateFeePerDay; }
function makeBookingReference_() {
  const sheet = campaignSpreadsheet_().getSheetByName('Bookings');
  const refs = sheet && sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues() : [];
  let current = 0;
  refs.forEach(function(row) {
    const match = clean_(row[0]).toUpperCase().match(/^FOB-LL-(\d{4,})$/);
    if (match) current = Math.max(current, Number(match[1]));
  });
  return 'FOB-LL-' + pad_(current + 1, 4);
}
function makeReference_(prefix) { return prefix+'-'+Utilities.formatDate(new Date(),'Asia/Manila','yyMMdd')+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,6).toUpperCase(); }
function normalizeDate_(value) { if(value instanceof Date)return Utilities.formatDate(value,'Asia/Manila','MMMM d, yyyy'); const s=clean_(value); if(/^Jan(?:uary)?\s*14(?:,?\s*2027)?$/i.test(s))return 'January 14, 2027';return s; }
function moneyNumber_(v) { const n=Number(String(v===undefined?'':v).replace(/[^0-9.-]/g,'')); return isFinite(n)?n:0; }
function clean_(v) { return String(v===undefined||v===null?'':v).trim(); }
function parseJson_(v,fallback){try{return JSON.parse(String(v||''));}catch(_){return fallback;}}
function pad_(n,w){return String(n).padStart(w,'0');}
function json_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}

// Campaign isolation: never run this project against the Bruno Mars workbook.
function assertCampaignSheet_(){if(campaignSpreadsheet_().getId()!=='1mlKOTJ0RllgRMM9SHXhqm-dWM7S-7h_zEZnVxjRw1sc')throw new Error('This project must be bound to the LaLaLakbay operations copy.');}
function bookingEnabled_(){return PropertiesService.getScriptProperties().getProperty('BOOKING_ENABLED')==='true';}
function findRequest_(id){const rows=campaignSpreadsheet_().getSheetByName('Bookings').getDataRange().getValues().slice(1);for(const r of rows){if(parseJson_(r[26],{}).requestId===id)return {ok:true,bookingRef:r[0],totalFare:r[13],remainingBalance:r[15],replayed:true};}return null;}
function ensureBusInventory_(){const s=campaignSpreadsheet_().getSheetByName('Seat_Inventory');const existing=s.getDataRange().getDisplayValues().slice(1).map(r=>normalizeDate_(r[0])+'|'+r[1]);const seats=[];for(let i=0;i<11;i++){const l=String.fromCharCode(65+i),r=String.fromCharCode(77+i);seats.push(l+'1',l+'2',r+'1',r+'2');}for(let n=1;n<=5;n++)seats.push('L'+n);const rows=[];LL.dates.forEach(date=>seats.forEach(seat=>{if(existing.indexOf(date+'|'+seat)>=0)return;const volunteer=LL.volunteerSeats.indexOf(seat)>=0,priority=LL.prioritySeats.indexOf(seat)>=0;rows.push([date,seat,volunteer?'VOLUNTEER':priority?'PRIORITY':'PASSENGER',volunteer||priority?'RESERVED':'AVAILABLE','','','','','','','','','','']);}));if(rows.length)s.getRange(s.getLastRow()+1,1,rows.length,14).setValues(rows);}
function releaseSelectedBooking(){assertCampaignSheet_();const ui=SpreadsheetApp.getUi();const a=ui.prompt('Release an unconfirmed booking','Enter the FOB-LL booking reference. Confirmed bookings are protected.',ui.ButtonSet.OK_CANCEL);if(a.getSelectedButton()!==ui.Button.OK)return;const lock=LockService.getScriptLock();lock.waitLock(30000);try{const ref=clean_(a.getResponseText()).toUpperCase(),b=findBooking_(ref);if(!b || clean_(b.row[10])==='CONFIRMED')throw new Error('Only an unconfirmed booking may be released.');const s=campaignSpreadsheet_().getSheetByName('Seat_Inventory'),rows=s.getDataRange().getValues();rows.forEach((r,i)=>{if(clean_(r[4])===ref){s.getRange(i+1,4,1,11).clearContent();s.getRange(i+1,4).setValue(LL.prioritySeats.indexOf(r[1])>=0?'RESERVED':'AVAILABLE');}});b.sheet.getRange(b.rowNum,11).setValue('CANCELLED');rebuildAllViews_();}finally{lock.releaseLock();}}

function sheetLiteral_(v){return typeof v==='string' && /^[=+@]/.test(v)?"'"+v:v;}

function releaseSeats_(ref){const s=campaignSpreadsheet_().getSheetByName('Seat_Inventory'),rows=s.getDataRange().getValues();rows.forEach((r,i)=>{if(clean_(r[4])===ref){s.getRange(i+1,4,1,11).clearContent();s.getRange(i+1,4).setValue(LL.prioritySeats.indexOf(r[1])>=0?'RESERVED':'AVAILABLE');}});}

function campaignSpreadsheet_(){return SpreadsheetApp.openById('1mlKOTJ0RllgRMM9SHXhqm-dWM7S-7h_zEZnVxjRw1sc');}

function outstandingLateFee_(ref,remaining){if(remaining<=0)return 0;const payments=campaignSpreadsheet_().getSheetByName('Payments').getDataRange().getValues().slice(1);const paidFees=payments.filter(p=>clean_(p[1])===ref && clean_(p[10])==='VERIFIED').reduce((sum,p)=>sum+moneyNumber_(p[19]),0);return Math.max(0,lateFee_()-paidFees);}
