/**
 * LALALAKBAY — LALALA FEST MANILA 2027 SHUTTLE
 * FansOnBoard PH passenger email template for Google Apps Script.
 *
 * Setup:
 * 1. Upload the LaLaLakbay header image and FansOnBoard PH logo to Google Drive.
 * 2. Paste their file IDs into LL_EMAIL_CONFIG below.
 * 3. Set websiteUrl, balancePageUrl, and Telegram URL when available.
 * 4. Call sendLaLaLakbayPendingEmail(booking) after a reservation is submitted.
 * 5. Call sendLaLaLakbayConfirmedEmail(booking) after payment is verified.
 */

const LL_EMAIL_CONFIG = {
  organizer: 'FansOnBoard PH',
  destination: 'Philippine Arena',
  dates: 'January 14, 2027',
  websiteUrl: 'https://lalalakbay.fans-on-boar-7052.chatgpt.site',
  balancePageUrl: 'https://lalalakbay.fans-on-boar-7052.chatgpt.site/balance.html',
  telegramUrl: 'PASTE_TELEGRAM_CHANNEL_URL',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61574150816211',
  instagramUrl: 'https://www.instagram.com/fansonboard_ph/',
  xUrl: 'https://x.com/FansOnBoard_PH',
  tiktokUrl: 'https://www.tiktok.com/@fansonboard.ph',
  heroPhotoFileId: '',
  fansOnBoardLogoFileId: '1r-TnCVx89kvyXCoXmX5qWBWGw-m9Ivz5'
};

function normalizeLaLaLakbayEmailBooking_(booking) {
  booking = booking || {};
  return {
    email: String(booking.email || '').trim(),
    fullName: String(booking.fullName || booking.primaryPassenger || 'Passenger').trim(),
    bookingRef: String(booking.bookingRef || booking.bookingReference || '—').trim(),
    vehicle: String(booking.vehicle || booking.vehicleType || '—').trim(),
    passengerCount: Number(booking.passengerCount || booking.numberOfSlots || 1),
    packageSelection: String(booking.packageSelection || booking.packageName || '—').trim(),
    paymentPlan: String(booking.paymentPlan || 'Full Payment').trim(),
    paymentChannel: String(booking.paymentChannel || '—').trim(),
    paymentReference: String(booking.paymentReference || booking.referenceNumber || '—').trim(),
    totalFare: Number(booking.totalFare || booking.total || 0),
    amountSubmitted: Number(booking.amountSubmitted || booking.amountPaid || 0),
    totalPaid: Number(booking.totalPaid || booking.verifiedPaid || 0),
    remainingBalance: Number(booking.remainingBalance || 0),
    paymentStatus: String(booking.paymentStatus || 'PENDING VERIFICATION').trim(),
    seatPolicy: booking.seatPolicy === 'PREFERENCE' ? 'PREFERENCE' : 'INVENTORY',
    trips: Array.isArray(booking.trips) ? booking.trips : [],
    addOnInterest: booking.addOnInterest || null,
    artistPreferences: Array.isArray(booking.artistPreferences) ? booking.artistPreferences : [],
    passengerTickets: Array.isArray(booking.passengerTickets) ? booking.passengerTickets : []
  };
}

function sendLaLaLakbayPendingEmail(booking) {
  const b = normalizeLaLaLakbayEmailBooking_(booking);
  if (!b.email) throw new Error('Booking email is missing.');

  const html = buildLaLaLakbayEmailHtml_({
    fullName: b.fullName,
    eyebrow: 'BOOKING RECEIVED',
    badge: 'PENDING PAYMENT VERIFICATION',
    title: 'Your LaLaLa Fest booking was received.',
    intro: 'We received your shuttle reservation and payment proof. The FansOnBoard PH team will review your submission before your booking is officially confirmed.',
    content:
      llInfoCard_('Booking Details', [
        ['Booking Reference', b.bookingRef],
        ['Primary Passenger', b.fullName],
        ['Passenger Count', b.passengerCount],
        ['Vehicle', b.vehicle],
        ['Package Selection', b.packageSelection]
      ]) +
      llArtistPreferencesCard_(b) +
      llAddOnInterestCard_(b) +
      llTripCard_(b) +
      llInfoCard_('Payment Details', [
        ['Payment Plan', b.paymentPlan],
        ['Payment Channel', b.paymentChannel],
        ['Reference Number', b.paymentReference],
        ['Total Fare', llPeso_(b.totalFare)],
        ['Amount Submitted', llPeso_(b.amountSubmitted)]
      ]) +
      (b.seatPolicy === 'PREFERENCE' ? llDesiredSeatsCard_() : llImportantCard_('SEATS TEMPORARILY HELD', 'Your selected seats are held while payment verification is in progress. Please do not create another reservation for the same passengers.')) +
      llImportantCard_('PAYMENT SCHEDULE', 'Reservation starts at ₱250 per slot. Reach at least 50% of the total fare by November 14, 2026, and complete the remaining balance by December 31, 2026. A ₱100 daily late fee applies to balances overdue after December 31, 2026.')
  });

  sendLaLaLakbayMail_(
    b.email,
    'Booking Received — LaLaLakbay Shuttle | ' + b.bookingRef,
    'Your LaLaLakbay shuttle booking ' + b.bookingRef + ' was received and is pending payment verification.',
    html
  );
}

function sendLaLaLakbayConfirmedEmail(booking) {
  const b = normalizeLaLaLakbayEmailBooking_(booking);
  if (!b.email) throw new Error('Booking email is missing.');

  let content =
    llInfoCard_('Booking Details', [
      ['Booking Reference', b.bookingRef],
      ['Primary Passenger', b.fullName],
      ['Passenger Count', b.passengerCount],
      ['Vehicle', b.vehicle],
      ['Package Selection', b.packageSelection],
      ['Booking Status', 'CONFIRMED']
    ]) +
    (b.passengerTickets.length
      ? llInfoCard_('Passenger Tickets', b.passengerTickets.map(function (x) {
          return [x.ticketId, x.name + (x.role ? ' • ' + x.role : '')];
        }))
      : '') +
    llArtistPreferencesCard_(b) +
      llAddOnInterestCard_(b) +
    llTripCard_(b) +
    (b.seatPolicy === 'PREFERENCE' ? llDesiredSeatsCard_() : '') +
    llInfoCard_('Payment Summary', [
      ['Total Fare', llPeso_(b.totalFare)],
      ['Verified Payment', llPeso_(b.totalPaid)],
      ['Remaining Balance', llPeso_(b.remainingBalance)],
      ['Final Balance Due', b.remainingBalance > 0 ? 'December 31, 2026' : 'FULLY PAID'],
      ['Payment Status', b.paymentStatus]
    ]) +
    llImportantCard_('SAVE YOUR BOOKING REFERENCE', 'Keep this email and your booking reference. Our staff may request them during passenger verification and boarding.') +
    llImportantCard_('FINAL TRIP DETAILS', 'Your exact assembly time, meeting point, route sequence, and assigned vehicle will be announced before concert day. A strict 10-minute grace period applies to the announced departure time.');

  if (b.remainingBalance > 0 && llValidUrl_(LL_EMAIL_CONFIG.balancePageUrl)) {
    content += llActionCard_(
      'Complete Your Remaining Balance',
      'Remaining balance: ' + llPeso_(b.remainingBalance) + ' • Final due date: December 31, 2026',
      'PAY REMAINING BALANCE',
      LL_EMAIL_CONFIG.balancePageUrl + '?ref=' + encodeURIComponent(b.bookingRef)
    );
  }

  if (llValidUrl_(LL_EMAIL_CONFIG.telegramUrl)) {
    content += llActionCard_(
      'Official Passenger Updates',
      'Join the official channel for payment notices, pickup instructions, reminders, and concert-day announcements.',
      'JOIN UPDATES CHANNEL',
      LL_EMAIL_CONFIG.telegramUrl
    );
  }

  const html = buildLaLaLakbayEmailHtml_({
    fullName: b.fullName,
    eyebrow: 'RESERVATION CONFIRMED',
    badge: 'YOU\'RE ON BOARD',
    title: 'Your concert-day ride is confirmed. 🎶',
    intro: 'Your payment has been verified and your LaLaLakbay — LaLaLa Fest Manila 2027 shuttle reservation is officially confirmed.',
    content: content
  });

  sendLaLaLakbayMail_(
    b.email,
    'You\'re Confirmed — LaLaLakbay Shuttle | ' + b.bookingRef,
    'Your LaLaLakbay shuttle booking ' + b.bookingRef + ' is confirmed.',
    html
  );
}

function buildLaLaLakbayEmailHtml_(config) {
  config = config || {};
  const fullName = config.fullName || 'Passenger';
  const eyebrow = config.eyebrow || 'LALALAKBAY SHUTTLE';
  const badge = config.badge || 'EMAIL PREVIEW';
  const title = config.title || 'LaLaLa Fest Manila 2027 Shuttle';
  const intro = config.intro || '';
  const content = config.content || '';

  return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#090305;font-family:Arial,Helvetica,sans-serif;color:#fff">' +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#090305;padding:26px 10px"><tr><td align="center">' +
    '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;background:#16070b;border:1px solid #7a2436;border-radius:24px;overflow:hidden">' +
      '<tr><td style="padding:0;background:#21070d;border-bottom:1px solid #7c2637">' +
        llHeroPhoto_() +
        '<div style="padding:0 30px 24px">' + llRouteStrip_() + '</div>' +
      '</td></tr>' +
      '<tr><td style="padding:28px">' +
        '<div style="font-size:10px;letter-spacing:2.5px;color:#d8aa59;font-weight:800">' + llEsc_(eyebrow) + '</div>' +
        '<div style="display:inline-block;margin-top:11px;padding:8px 13px;border-radius:999px;background:#322346;color:#fff;font-size:10px;font-weight:900;letter-spacing:1px">' + llEsc_(badge) + '</div>' +
        '<h1 style="margin:20px 0 0;font-family:Georgia,Times New Roman,serif;font-size:30px;line-height:1.16;color:#fff">' + title + '</h1>' +
        '<p style="margin:20px 0 0;color:#e8ddd5;font-size:15px;line-height:1.8">Hi <strong style="color:#fff">' + llEsc_(fullName) + '</strong>,</p>' +
        '<p style="margin:8px 0 0;color:#cbb9ac;font-size:15px;line-height:1.8">' + intro + '</p>' +
        content +
        llInfoCard_('Shuttle Information', [
          ['Event', 'LaLaLakbay — LaLaLa Fest Manila 2027'],
          ['Venue', LL_EMAIL_CONFIG.destination],
          ['Event Date', LL_EMAIL_CONFIG.dates],
          ['Service', 'Roundtrip fan shuttle']
        ]) +
        llFooter_() +
      '</td></tr>' +
    '</table></td></tr></table></body></html>';
}

function llHeroPhoto_() {
  if (llValidDriveId_(LL_EMAIL_CONFIG.heroPhotoFileId)) {
    return '<img src="cid:lalalaHero" alt="LaLaLakbay — LaLaLa Fest Manila 2027 Shuttle" width="680" style="display:block;width:100%;max-width:680px;height:auto;border:0">';
  }
  return '<div style="padding:38px 28px;text-align:center;background:#21070d">' +
    '<div style="font-family:Arial Black,Arial,sans-serif;font-size:42px;font-weight:900;color:#fff">LALALAKBAY</div>' +
    '<div style="margin-top:10px;font-size:15px;letter-spacing:4px;color:#d8aa59;font-weight:800">LALALA FEST MANILA 2027 SHUTTLE</div>' +
    '<div style="margin-top:20px;font-size:9px;letter-spacing:2px;color:#cbb9ac">CONCERT SHUTTLE RESERVATION · BROUGHT TO YOU BY FANSONBOARD PH</div>' +
  '</div>';
}

function llRouteStrip_() {
  return '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;border-top:2px solid #b83b50"><tr>' +
    '<td style="padding-top:10px;font-size:9px;letter-spacing:1.3px;color:#9f8e82">PICKUP NETWORK</td>' +
    '<td align="center" style="padding-top:8px;color:#e0b96c;font-size:14px">● ━━━ RIDE ━━━ ●</td>' +
    '<td align="right" style="padding-top:10px;font-size:9px;letter-spacing:1.3px;color:#9f8e82">PH ARENA</td>' +
    '</tr></table>';
}

function llArtistPreferencesCard_(booking) {
  const preferences=booking.artistPreferences||[];
  if(!preferences.length)return '';
  return llInfoCard_('Artist Preferences',preferences.map(function(p){return [p.name+' · '+p.packageName,p.label];}));
}

function llInfoCard_(title, rows) {
  rows = Array.isArray(rows) ? rows : [];
  const body = rows.filter(function (r) {
    return r && r.length >= 2 && r[1] !== undefined && r[1] !== null && String(r[1]).trim() !== '';
  }).map(function (r) {
    return '<tr><td style="padding:12px 0;border-bottom:1px solid #512330;color:#b9969d;font-size:12px">' + llEsc_(r[0]) + '</td>' +
      '<td align="right" style="padding:12px 0;border-bottom:1px solid #512330;color:#fff;font-size:13px;font-weight:700">' + llEsc_(r[1]) + '</td></tr>';
  }).join('');
  return '<div style="margin-top:20px;padding:18px;background:#211015;border:1px solid #683040;border-radius:18px">' +
    '<div style="margin-bottom:7px;font-size:10px;letter-spacing:2px;color:#d8aa59;font-weight:800;text-transform:uppercase">' + llEsc_(title) + '</div>' +
    '<table width="100%" cellpadding="0" cellspacing="0">' + body + '</table></div>';
}

function llTripCard_(b) {
  if (!b.trips.length) return '';
  const rows = b.trips.map(function (t) {
    const seats = Array.isArray(t.seats) ? t.seats.join(', ') : (t.seat || '—');
    return '<tr>' +
      '<td style="padding:13px 0;border-bottom:1px solid #512330;color:#fff;font-size:12px;font-weight:800">' + llEsc_(t.date || '—') + '</td>' +
      '<td style="padding:13px 8px;border-bottom:1px solid #512330;color:#e0b96c;font-size:13px;font-weight:900">' + llEsc_(seats) + '</td>' +
      '<td align="right" style="padding:13px 0;border-bottom:1px solid #512330;color:#d2afb7;font-size:12px">' + llEsc_(t.pickup || '—') + (t.time ? '<br>' + llEsc_(t.time) : '') + '</td>' +
    '</tr>';
  }).join('');
  return '<div style="margin-top:20px;padding:18px;background:#211015;border:1px solid #683040;border-radius:18px">' +
    '<div style="margin-bottom:10px;font-size:10px;letter-spacing:2px;color:#d8aa59;font-weight:800">TRIP DETAILS</div>' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:9px;color:#7d6e65">DATE</td><td style="font-size:9px;color:#7d6e65">' + (b.seatPolicy === 'PREFERENCE' ? 'DESIRED SEATS — NOT FINAL' : 'SEAT(S)') + '</td><td align="right" style="font-size:9px;color:#7d6e65">PICKUP</td></tr>' + rows + '</table></div>';
}

function llAddOnInterestCard_(b) {
  if(!b.addOnInterest)return '';
  const labels={UNSPECIFIED:'Not specified',INTERESTED:'Yes — send me details',MAYBE:'Maybe — still deciding',NOT_NOW:'Not interested for now',INCLUDED:'Already included with Bus VIP Ride'};
  return llInfoCard_('Add-on Interest — No Extra Charge', [
    ['Bus Cooling Lounge', labels[b.addOnInterest.lounge]||'Not specified'],
    ['Pre-order meals', labels[b.addOnInterest.meals]||'Not specified'],
    ['Lounge already included', String(Number(b.addOnInterest.loungeIncludedCount)||0)+' passenger(s)'],
    ['Next steps', 'Interest only. Availability, rates, menu and ordering details to be announced. No extra access or meals reserved.']
  ]);
}

function llDesiredSeatsCard_() {
  return llImportantCard_('DESIRED SEATS ONLY — NOT YET FINAL', 'Your bus seat selections are preferences, not guaranteed or officially reserved seats. FansOnBoard PH may merge pick-up routes. For bookings made in 2026, final routes and official seat assignments will be announced during the first week of January 2027, ahead of January 14. We will do our best to keep your group together, subject to final bus arrangements. Payment verification confirms your booking, not your desired seat assignments.');
}

function llImportantCard_(title, message) {
  return '<div style="margin-top:18px;padding:18px;background:#2c0e16;border:1px solid #715192;border-radius:18px">' +
    '<div style="font-size:13px;font-weight:900;color:#f1c976">' + llEsc_(title) + '</div>' +
    '<div style="margin-top:7px;font-size:13px;line-height:1.7;color:#ddcec4">' + llEsc_(message) + '</div></div>';
}

function llActionCard_(title, message, label, url) {
  if (!llValidUrl_(url)) return '';
  return '<div style="margin-top:18px;padding:20px;background:#211015;border:1px solid #683040;border-radius:18px">' +
    '<div style="color:#fff;font-size:15px;font-weight:800">' + llEsc_(title) + '</div>' +
    '<p style="margin:7px 0 16px;color:#bca99d;font-size:13px;line-height:1.65">' + llEsc_(message) + '</p>' +
    '<a href="' + llEsc_(url) + '" target="_blank" style="display:inline-block;padding:13px 20px;background:#9254ff;border-radius:999px;color:#fff;text-decoration:none;font-size:11px;font-weight:900;letter-spacing:.4px">' + llEsc_(label) + '</a></div>';
}

function llFooter_() {
  return '<div style="margin-top:30px;padding-top:24px;border-top:1px solid #5a2633;text-align:center">' +
    llLogo_() +
    '<div style="margin-top:15px;font-size:14px;font-weight:900;letter-spacing:1.4px;color:#fff">FANSONBOARD PH</div>' +
    '<div style="margin-top:5px;font-size:10px;line-height:1.7;color:#94847a">LaLaLakbay — LaLaLa Fest Manila 2027 Shuttle<br>January 14, 2027 · Philippine Arena</div>' +
    llSocials_() +
    '<div style="margin-top:18px;font-size:9px;line-height:1.6;color:#71635b">This is an independently organized fan shuttle service.<br>Not affiliated with LaLaLakbay, Live Nation, Philippine Arena, or the official concert organizers.</div></div>';
}

function llLogo_() {
  if (!llValidDriveId_(LL_EMAIL_CONFIG.fansOnBoardLogoFileId)) return '';
  return '<img src="cid:fansOnBoardLogo" alt="FansOnBoard PH" width="76" style="display:inline-block;width:76px;height:auto;border:0">';
}

function llSocials_() {
  const links = [
    ['f', LL_EMAIL_CONFIG.facebookUrl, 'Facebook'],
    ['◎', LL_EMAIL_CONFIG.instagramUrl, 'Instagram'],
    ['X', LL_EMAIL_CONFIG.xUrl, 'X'],
    ['♪', LL_EMAIL_CONFIG.tiktokUrl, 'TikTok'],
    ['↗', LL_EMAIL_CONFIG.websiteUrl, 'Website']
  ];
  const icons = links.filter(function (x) { return llValidUrl_(x[1]); }).map(function (x) {
    return '<a href="' + llEsc_(x[1]) + '" target="_blank" title="' + llEsc_(x[2]) + '" style="display:inline-block;margin:0 4px;width:34px;height:34px;line-height:34px;border-radius:50%;background:#151e43;border:1px solid #715192;color:#f7a3d8;text-decoration:none;font-size:13px;font-weight:900;text-align:center">' + x[0] + '</a>';
  }).join('');
  return '<div style="margin-top:14px;text-align:center">' + icons + '</div>';
}

function sendLaLaLakbayMail_(to, subject, plainBody, htmlBody) {
  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    inlineImages: getLaLaLakbayInlineImages_(),
    name: LL_EMAIL_CONFIG.organizer
  });
}

function getLaLaLakbayInlineImages_() {
  const images = {};
  llAddImage_(images, 'lalalaHero', LL_EMAIL_CONFIG.heroPhotoFileId, 'lalala-email-header.png');
  llAddImage_(images, 'fansOnBoardLogo', LL_EMAIL_CONFIG.fansOnBoardLogoFileId, 'fansonboard-ph-logo.png');
  return images;
}

function llAddImage_(images, key, id, name) {
  if (!llValidDriveId_(id)) return;
  try { images[key] = DriveApp.getFileById(id).getBlob().setName(name); }
  catch (err) { Logger.log('Email image failed (' + key + '): ' + err.message); }
}

function llPeso_(value) {
  return '₱' + Number(value || 0).toLocaleString('en-PH', {maximumFractionDigits: 2});
}

function llEsc_(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function llValidUrl_(url) {
  url = String(url || '').trim();
  return /^https?:\/\//i.test(url) && url.indexOf('PASTE_') < 0;
}

function llValidDriveId_(id) {
  id = String(id || '').trim();
  return Boolean(id) && id.indexOf('PASTE_') !== 0;
}

/** Run this to send a styled preview to your own email. */
function TEST_sendLaLaLakbayPendingEmail() {
  sendLaLaLakbayPendingEmail({
    email: Session.getActiveUser().getEmail(),
    fullName: 'Kate Test',
    bookingRef: 'FOB-LL-TEST-001',
    vehicle: 'Bus',
    passengerCount: 2,
    packageSelection: 'FOB FAN RIDE',
    paymentPlan: '₱250 per Slot Installment Plan',
    paymentChannel: 'GCash',
    paymentReference: '1234567890123',
    totalFare: 1900,
    amountSubmitted: 500,
    trips: [
      {date: 'January 14, 2027', seats: ['C1', 'C2'], pickup: 'SM North EDSA', time: 'To be announced'}
    ]
  });
}

function sendLaLaLakbayCorrectionEmail(booking){const b=normalizeLaLaLakbayEmailBooking_(booking);sendLaLaLakbayMail_(b.email,'Payment needs review — LaLaLakbay | '+b.bookingRef,'Your payment needs correction. Contact FansOnBoard PH with reference '+b.bookingRef,buildLaLaLakbayEmailHtml_({fullName:b.fullName,eyebrow:'PAYMENT REVIEW',badge:'CORRECTION NEEDED',title:'Please check your payment.',intro:'The team could not verify a payment submission. Contact FansOnBoard PH with your booking reference before sending another payment.',content:llInfoCard_('Booking',[['Booking reference',b.bookingRef]])}));}
