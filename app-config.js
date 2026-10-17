window.FOB_CONFIG = {
  backendUrl: "https://script.google.com/macros/s/AKfycbyvJ30RsRD2SFTxGnmkI4qdMuAYyQDHmppeX6DjgVR-Yym4yGVbu7Xv85ijWVrrjhWwmg/exec",
  bookingEnabled: true,
  campaignId: "lalalakbay-2027",
  previewMode: false,
  deadlines: { half: "November 14, 2026", full: "December 31, 2026" },
  first10Promo: {limit: 10, discountPerPassenger: 50},
  maxPassengers: 5,
  maxFileSize: 4 * 1024 * 1024,
  eventDates: ["January 14"],
  paymentAccounts: {
    "GCash": {
      name: "KVOD",
      number: "09774885878",
      qrImage: "assets/payment-gcash-qr.jpeg",
      qrUrl: "https://drive.google.com/file/d/1aEONdAVo1E7OAgw-aZwWsYojgf36vDtK/view?usp=drivesdk",
      note: "Send your payment to this GCash account, then enter the reference number and upload your proof of payment below."
    },
    "Maya": {
      name: "KVOD",
      number: "09562440071",
      qrImage: "assets/payment-maya-qr.jpeg",
      qrUrl: "https://drive.google.com/file/d/1hKRcL8MAWmeNED3gdAs9Nr05f7_Hn1zU/view?usp=drivesdk",
      note: "Send your payment to this Maya account, then enter the reference number and upload your proof of payment below."
    },
    "Bank Transfer": {
      bank: "BDO",
      qrOnly: true,
      qrImage: "assets/payment-bdo-qr.jpeg",
      qrUrl: "https://drive.google.com/file/d/1aWpAs84rJoGqXTWsoaDCzn-2lGyCKja0/view?usp=drivesdk",
      note: "Use the official BDO QR code. The account name and account number are intentionally not displayed."
    }
  },
  pickupPoints: ["SM MOA", "SM North EDSA", "Araneta Cubao", "One Ayala", "SM Megamall", "SM Fairview", "Rodriguez, Rizal", "SM Bacoor", "SM Dasma"],
  pickupRules: {
    noBus: ["SM Bacoor", "SM Dasma", "Rodriguez, Rizal"],
    vanPriceOverrides: {
      "SM Bacoor": { "normal-van": 1100, "vip-van": 1500 },
      "SM Dasma": { "normal-van": 1100, "vip-van": 1500 },
      "Rodriguez, Rizal": { "normal-van": 1100, "vip-van": 1500 }
    }
  },
  seatLayouts: {
    bus: {
      source: "LILIBUS SEAT DAY 1",
      rows: [["A1","A2","M1","M2"],["B1","B2","N1","N2"],["C1","C2","O1","O2"],["D1","D2","P1","P2"],["E1","E2","Q1","Q2"],["F1","F2","R1","R2"],["G1","G2","S1","S2"],["H1","H2","T1","T2"],["I1","I2","U1","U2"],["J1","J2","V1","V2"],["K1","K2","W1","W2"]],
      backRow: ["L1","L2","L3","L4","L5"],
      priority: ["A1","A2","B1","B2","N1","N2"],
      volunteer: ["M1","M2"]
    }
  },
  freebieKit: ["Bottled water", "Button pin", "Stickers", "Photocard"],
  packages: {
    bus: [
      { id: "normal-bus", name: "FOB RIDE", shortName: "FOB RIDE", detail: "Shuttle Only", price: 850, pickup: "Assembly time TBA", vehicle: "BUS 01", freebies: false, lounge: false, tierLabel: "PACKAGE 01 · SHUTTLE ONLY", inclusions: ["Roundtrip bus shuttle", "Organized pickup and return", "Event-day coordinator", "Parking / toll coordination"] },
      { id: "bus-freebies", name: "FOB FAN RIDE", shortName: "FOB FAN RIDE", detail: "Shuttle + Artist-Themed Fan Freebies", price: 999, pickup: "Assembly time TBA", vehicle: "BUS 02", freebies: true, lounge: false, tierLabel: "PACKAGE 02 · SHUTTLE + FAN FREEBIES", popular: true, badge: "Popular", inclusions: ["Roundtrip bus shuttle", "Artist-themed button pin", "Sticker pack + photocard", "Bottled water", "Event-day coordinator"] },
      { id: "bus-lounge", name: "FOB VIP RIDE", shortName: "FOB VIP RIDE", detail: "Shuttle + Fan Freebies + 3-hour Cooling Lounge + LaLaLakbay Eco Bag", price: 1250, pickup: "Assembly time TBA", vehicle: "BUS 02", freebies: true, lounge: true, ecoBag: true, tierLabel: "PACKAGE 03 · FREEBIES + COOLING LOUNGE", badge: "VIP Bus", inclusions: ["Roundtrip bus shuttle", "Artist-themed button pin", "Sticker pack + photocard", "Bottled water", "3-hour Cooling Lounge access", "LaLaLakbay Eco Bag", "Event-day coordinator"] }
    ],
    van: [
      { id: "normal-van", name: "FOB RIDE", shortName: "FOB RIDE", detail: "Regular Van · 14 passengers · Shuttle Only", price: 950, pickup: "Assembly time TBA", vehicle: "VAN 01", freebies: false, lounge: false, tierLabel: "PACKAGE 01 · REGULAR VAN · 14 SEATS", capacity: 14, inclusions: ["Roundtrip regular van shuttle", "14-passenger regular van", "Organized pickup and return", "Event-day coordinator", "No freebies included"] },
      { id: "vip-van", name: "FOB FAN RIDE", shortName: "FOB FAN RIDE", detail: "VIP Van · 12 passengers · Fan Freebies + LaLaLakbay Eco Bag", price: 1250, pickup: "Assembly time TBA", vehicle: "VIP VAN 01", freebies: true, lounge: false, tierLabel: "PACKAGE 02 · VIP VAN + FAN FREEBIES", capacity: 12, ecoBag: true, badge: "VIP Van", inclusions: ["Roundtrip VIP van shuttle", "VIP van comfort · 12-passenger capacity", "Artist-themed button pin", "Sticker pack + photocard", "Bottled water", "LaLaLakbay Eco Bag", "Event-day coordinator"] }
    ]
  }
};
