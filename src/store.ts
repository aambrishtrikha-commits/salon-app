export type Status = "Pending" | "Confirmed" | "Completed" | "Cancelled" | "No-show";
export type Addon = { id: string; name: string; price: number; duration: number };

export type Staff = { id: string; name: string; role: string; specialty: string };
export type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  reminderDays: number;
};
export type Customer = {
  id: string;
  name: string;
  phone: string;
  consent: boolean;
  lastVisit: string | null;
  visits: number;
  preferredStaff: string | null;
  paidCredit: number;
  bonusCredit: number;
};
export type Booking = {
  id: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  date: string;
  slot: string;
  status: Status;
  addons: Addon[];
  total: number;
  referralCode?: string;
  createdBy: "customer" | "owner";
};
export type WalletTx = {
  id: string;
  customerId: string;
  type: "credit_paid" | "credit_bonus" | "debit" | "refund" | "reversal";
  amount: number;
  reason: string;
  at: string;
};
export type Referral = {
  id: string;
  referrerId: string;
  code: string;
  refereePhone?: string;
  status: "Pending" | "Released" | "Cancelled";
};
export type Reminder = {
  id: string;
  customerId: string;
  serviceId: string;
  dueDate: string;
  status: "Scheduled" | "Booked" | "OptedOut" | "Expired";
};
export type Settings = {
  salonName: string;
  location: string;
  phone: string;
  bonusFixed: number;
  minTopup: number;
  expiryDays: number;
  reminderDays: number;
  refReferrer: number;
  refReferee: number;
};

export type DB = {
  settings: Settings;
  staff: Staff[];
  services: Service[];
  customers: Customer[];
  bookings: Booking[];
  txs: WalletTx[];
  referrals: Referral[];
  reminders: Reminder[];
};

export const SLOTS = ["10:00", "11:00", "12:00", "14:00", "15:30", "17:00", "18:30"];
export const TODAY = "2026-08-19";
const KEY = "creative-salon-v1";

function nid(p: string) {
  return `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}
function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seed(): DB {
  return {
    settings: {
      salonName: "Creative Salon",
      location: "Pitampura, Delhi",
      phone: "9876543210",
      bonusFixed: 50,
      minTopup: 500,
      expiryDays: 180,
      reminderDays: 25,
      refReferrer: 100,
      refReferee: 100,
    },
    staff: [
      { id: "staff_01", name: "Rajesh Kumar", role: "Senior Barber", specialty: "Men's cuts & beard" },
      { id: "staff_02", name: "Priya Sharma", role: "Stylist", specialty: "Women, colour & spa" },
      { id: "staff_03", name: "Amit Verma", role: "Barber", specialty: "Beard, kids & quick cuts" },
    ],
    services: [
      { id: "svc_01", name: "Men's Haircut", price: 299, duration: 30, reminderDays: 25 },
      { id: "svc_02", name: "Women's Haircut", price: 499, duration: 45, reminderDays: 35 },
      { id: "svc_03", name: "Beard Trim", price: 99, duration: 15, reminderDays: 20 },
      { id: "svc_04", name: "Head Massage", price: 199, duration: 20, reminderDays: 0 },
      { id: "svc_05", name: "Hair Wash + Blow Dry", price: 249, duration: 25, reminderDays: 0 },
      { id: "svc_06", name: "Basic Facial", price: 399, duration: 40, reminderDays: 30 },
      { id: "svc_07", name: "Root Touch-up Colour", price: 799, duration: 60, reminderDays: 40 },
      { id: "svc_08", name: "Kids Haircut", price: 199, duration: 20, reminderDays: 30 },
      { id: "svc_09", name: "Eyebrow Threading", price: 49, duration: 10, reminderDays: 0 },
      { id: "svc_10", name: "Full Hair Spa", price: 899, duration: 75, reminderDays: 45 },
    ],
    customers: [
      { id: "cust_01", name: "Ankit Mehra", phone: "9876543210", consent: true, lastVisit: "2026-07-25", visits: 4, preferredStaff: "staff_01", paidCredit: 500, bonusCredit: 50 },
      { id: "cust_02", name: "Neha Gupta", phone: "9812345678", consent: true, lastVisit: "2026-08-10", visits: 2, preferredStaff: "staff_02", paidCredit: 0, bonusCredit: 0 },
      { id: "cust_03", name: "Rohit Singh", phone: "9765432109", consent: true, lastVisit: "2026-08-02", visits: 6, preferredStaff: "staff_01", paidCredit: 200, bonusCredit: 20 },
      { id: "cust_04", name: "Priya Kapoor", phone: "9900112233", consent: false, lastVisit: "2026-07-18", visits: 1, preferredStaff: null, paidCredit: 0, bonusCredit: 0 },
      { id: "cust_05", name: "Vikram Joshi", phone: "9123456780", consent: true, lastVisit: "2026-08-05", visits: 3, preferredStaff: "staff_03", paidCredit: 1000, bonusCredit: 100 },
      { id: "cust_06", name: "Sneha Reddy", phone: "9988776655", consent: true, lastVisit: null, visits: 0, preferredStaff: null, paidCredit: 0, bonusCredit: 0 },
      { id: "cust_07", name: "Arjun Malhotra", phone: "9876501234", consent: true, lastVisit: "2026-08-12", visits: 5, preferredStaff: "staff_01", paidCredit: 0, bonusCredit: 0 },
      { id: "cust_08", name: "Meera Iyer", phone: "9765123456", consent: true, lastVisit: "2026-07-28", visits: 2, preferredStaff: "staff_02", paidCredit: 300, bonusCredit: 30 },
      { id: "cust_09", name: "Karan Patel", phone: "9810987654", consent: true, lastVisit: "2026-08-01", visits: 1, preferredStaff: "staff_03", paidCredit: 0, bonusCredit: 0 },
      { id: "cust_10", name: "Divya Nair", phone: "9900554433", consent: true, lastVisit: "2026-08-15", visits: 3, preferredStaff: "staff_02", paidCredit: 150, bonusCredit: 0 },
    ],
    bookings: [
      { id: "bk_1001", customerId: "cust_01", serviceId: "svc_01", staffId: "staff_01", date: "2026-08-20", slot: "11:00", status: "Confirmed", addons: [], total: 299, createdBy: "customer" },
      { id: "bk_1002", customerId: "cust_02", serviceId: "svc_02", staffId: "staff_02", date: TODAY, slot: "14:30", status: "Completed", addons: [], total: 499, createdBy: "owner" },
      { id: "bk_1003", customerId: "cust_03", serviceId: "svc_01", staffId: "staff_01", date: TODAY, slot: "16:00", status: "Completed", addons: [{ id: "svc_03", name: "Beard Trim", price: 99, duration: 15 }], total: 398, createdBy: "owner" },
      { id: "bk_1004", customerId: "cust_07", serviceId: "svc_01", staffId: "staff_01", date: TODAY, slot: "10:00", status: "Confirmed", addons: [], total: 299, createdBy: "customer" },
      { id: "bk_1005", customerId: "cust_10", serviceId: "svc_02", staffId: "staff_02", date: TODAY, slot: "11:00", status: "Pending", addons: [], total: 499, createdBy: "customer" },
      { id: "bk_1006", customerId: "cust_05", serviceId: "svc_03", staffId: "staff_03", date: "2026-08-21", slot: "12:00", status: "Confirmed", addons: [], total: 99, createdBy: "customer" },
    ],
    txs: [
      { id: "wtx_1", customerId: "cust_01", type: "credit_paid", amount: 500, reason: "Top-up ₹500", at: "2026-08-12 16:00" },
      { id: "wtx_2", customerId: "cust_01", type: "credit_bonus", amount: 50, reason: "Bonus on ₹500 top-up", at: "2026-08-12 16:00" },
      { id: "wtx_3", customerId: "cust_03", type: "credit_paid", amount: 200, reason: "Top-up ₹200", at: "2026-08-05 11:20" },
      { id: "wtx_4", customerId: "cust_03", type: "credit_bonus", amount: 20, reason: "Bonus on top-up", at: "2026-08-05 11:20" },
      { id: "wtx_5", customerId: "cust_05", type: "credit_paid", amount: 1000, reason: "Top-up ₹1000", at: "2026-08-05 09:00" },
      { id: "wtx_6", customerId: "cust_05", type: "credit_bonus", amount: 100, reason: "Bonus on top-up", at: "2026-08-05 09:00" },
      { id: "wtx_7", customerId: "cust_08", type: "credit_paid", amount: 300, reason: "Top-up ₹300", at: "2026-07-28 13:00" },
      { id: "wtx_8", customerId: "cust_08", type: "credit_bonus", amount: 30, reason: "Bonus on top-up", at: "2026-07-28 13:00" },
      { id: "wtx_9", customerId: "cust_10", type: "credit_paid", amount: 150, reason: "Partial top-up", at: "2026-08-15 10:00" },
    ],
    referrals: [
      { id: "ref_201", referrerId: "cust_01", code: "CREA-ANKIT10", refereePhone: "9988776655", status: "Pending" },
    ],
    reminders: [
      { id: "rem_301", customerId: "cust_01", serviceId: "svc_01", dueDate: TODAY, status: "Scheduled" },
      { id: "rem_302", customerId: "cust_03", serviceId: "svc_01", dueDate: "2026-09-13", status: "Scheduled" },
      { id: "rem_303", customerId: "cust_02", serviceId: "svc_02", dueDate: "2026-09-23", status: "Scheduled" },
    ],
  };
}

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* ignore */
  }
  const db = seed();
  saveDB(db);
  return db;
}

export function saveDB(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function resetDB() {
  localStorage.removeItem(KEY);
  return seed();
}

export function inr(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

export function usable(c: Customer) {
  return c.paidCredit + c.bonusCredit;
}

export function lookupOrCreate(db: DB, phone: string, name?: string): Customer {
  const p = phone.replace(/\D/g, "").slice(-10);
  if (p.length !== 10) throw new Error("Enter a valid 10-digit mobile number");
  const found = db.customers.find((c) => c.phone === p);
  if (found) return found;
  const c: Customer = {
    id: nid("cust"),
    name: name?.trim() || "New Guest",
    phone: p,
    consent: true,
    lastVisit: null,
    visits: 0,
    preferredStaff: null,
    paidCredit: 0,
    bonusCredit: 0,
  };
  db.customers.push(c);
  saveDB(db);
  return c;
}

export function slotTaken(db: DB, staffId: string, date: string, slot: string) {
  return db.bookings.some(
    (b) =>
      b.staffId === staffId &&
      b.date === date &&
      b.slot === slot &&
      (b.status === "Pending" || b.status === "Confirmed"),
  );
}

export function createBooking(
  db: DB,
  input: {
    customerId: string;
    serviceId: string;
    staffId: string;
    date: string;
    slot: string;
    addons: Addon[];
    createdBy: "customer" | "owner";
    referralCode?: string;
  },
): Booking {
  if (slotTaken(db, input.staffId, input.date, input.slot)) {
    throw new Error("That slot was just taken. Choose another.");
  }
  const svc = db.services.find((s) => s.id === input.serviceId);
  if (!svc) throw new Error("Service unavailable");
  const total = svc.price + input.addons.reduce((s, a) => s + a.price, 0);
  const b: Booking = {
    id: nid("bk"),
    customerId: input.customerId,
    serviceId: input.serviceId,
    staffId: input.staffId,
    date: input.date,
    slot: input.slot,
    status: "Confirmed",
    addons: input.addons,
    total,
    createdBy: input.createdBy,
    referralCode: input.referralCode,
  };
  db.bookings.unshift(b);
  db.reminders.forEach((r) => {
    if (
      r.customerId === input.customerId &&
      r.serviceId === input.serviceId &&
      r.status === "Scheduled"
    ) {
      r.status = "Booked";
    }
  });
  saveDB(db);
  return b;
}

export function completeVisit(db: DB, bookingId: string) {
  const b = db.bookings.find((x) => x.id === bookingId);
  if (!b) throw new Error("Booking not found");
  if (b.status === "Completed") return;
  b.status = "Completed";
  const c = db.customers.find((x) => x.id === b.customerId);
  const svc = db.services.find((x) => x.id === b.serviceId);
  if (c) {
    c.visits += 1;
    c.lastVisit = b.date;
  }
  db.reminders.forEach((r) => {
    if (r.customerId === b.customerId && r.serviceId === b.serviceId && r.status === "Scheduled") {
      r.status = "Expired";
    }
  });
  if (svc && svc.reminderDays > 0 && c?.consent) {
    db.reminders.push({
      id: nid("rem"),
      customerId: b.customerId,
      serviceId: b.serviceId,
      dueDate: addDays(b.date, svc.reminderDays),
      status: "Scheduled",
    });
  }
  if (b.referralCode) {
    const ref = db.referrals.find((r) => r.code === b.referralCode && r.status === "Pending");
    if (ref && ref.referrerId !== b.customerId) {
      ref.status = "Released";
      const referrer = db.customers.find((x) => x.id === ref.referrerId);
      if (referrer) {
        referrer.bonusCredit += db.settings.refReferrer;
        db.txs.unshift({
          id: nid("wtx"),
          customerId: referrer.id,
          type: "credit_bonus",
          amount: db.settings.refReferrer,
          reason: "Referral reward released",
          at: new Date().toLocaleString("en-IN"),
        });
      }
    }
  }
  saveDB(db);
}

export function setStatus(db: DB, bookingId: string, status: Status) {
  if (status === "Completed") return completeVisit(db, bookingId);
  const b = db.bookings.find((x) => x.id === bookingId);
  if (!b) throw new Error("Booking not found");
  b.status = status;
  saveDB(db);
}

export function topUp(db: DB, customerId: string, amount: number) {
  const c = db.customers.find((x) => x.id === customerId);
  if (!c) throw new Error("Customer not found");
  const pay = Math.max(amount, db.settings.minTopup);
  const bonus = pay >= 500 ? db.settings.bonusFixed : 0;
  c.paidCredit += pay;
  c.bonusCredit += bonus;
  const at = new Date().toLocaleString("en-IN");
  db.txs.unshift({
    id: nid("wtx"),
    customerId,
    type: "credit_paid",
    amount: pay,
    reason: `Top-up ₹${pay}`,
    at,
  });
  if (bonus) {
    db.txs.unshift({
      id: nid("wtx"),
      customerId,
      type: "credit_bonus",
      amount: bonus,
      reason: `Bonus on ₹${pay} top-up`,
      at,
    });
  }
  saveDB(db);
  return { pay, bonus };
}

export function adjustWallet(
  db: DB,
  customerId: string,
  type: WalletTx["type"],
  amount: number,
  reason: string,
) {
  if (!reason.trim()) throw new Error("Reason is required for every manual change");
  const c = db.customers.find((x) => x.id === customerId);
  if (!c) throw new Error("Customer not found");
  const amt = Math.abs(amount);
  if (type === "debit" || type === "reversal" || type === "refund") {
    if (amt > usable(c)) throw new Error("Cannot debit more than usable credit");
    const fromPaid = Math.min(amt, c.paidCredit);
    c.paidCredit -= fromPaid;
    c.bonusCredit -= amt - fromPaid;
  } else if (type === "credit_paid") {
    c.paidCredit += amt;
  } else {
    c.bonusCredit += amt;
  }
  db.txs.unshift({
    id: nid("wtx"),
    customerId,
    type,
    amount: amt,
    reason: reason.trim(),
    at: new Date().toLocaleString("en-IN"),
  });
  saveDB(db);
}

export function setConsent(db: DB, customerId: string, consent: boolean) {
  const c = db.customers.find((x) => x.id === customerId);
  if (!c) return;
  c.consent = consent;
  if (!consent) {
    db.reminders.forEach((r) => {
      if (r.customerId === customerId && r.status === "Scheduled") r.status = "OptedOut";
    });
  }
  saveDB(db);
}

export function ensureReferral(db: DB, customerId: string): Referral {
  const existing = db.referrals.find((r) => r.referrerId === customerId);
  if (existing) return existing;
  const c = db.customers.find((x) => x.id === customerId)!;
  const first = (c.name.split(" ")[0] || "USER").toUpperCase().slice(0, 5);
  const ref: Referral = {
    id: nid("ref"),
    referrerId: customerId,
    code: `CREA-${first}${c.phone.slice(-2)}`,
    status: "Pending",
  };
  db.referrals.push(ref);
  saveDB(db);
  return ref;
}

export function addCustomer(db: DB, name: string, phone: string) {
  return lookupOrCreate(db, phone, name);
}

export function dashboard(db: DB) {
  const today = db.bookings.filter((b) => b.date === TODAY);
  const done = today.filter((b) => b.status === "Completed");
  const allDone = db.bookings.filter((b) => b.status === "Completed");
  const revenue = done.reduce((s, b) => s + b.total, 0);
  const avg = allDone.length ? Math.round(allDone.reduce((s, b) => s + b.total, 0) / allDone.length) : 0;
  const repeat = done.filter((b) => (db.customers.find((c) => c.id === b.customerId)?.visits ?? 0) > 1).length;
  const fresh = done.length - repeat;
  const outstanding = db.customers.reduce((s, c) => s + usable(c), 0);
  const walletToday = db.txs.filter((t) => t.type === "credit_paid" && t.at.includes("2026-08-19")).reduce((s, t) => s + t.amount, 0);
  const bonusToday = db.txs.filter((t) => t.type === "credit_bonus" && t.at.includes("2026-08-19")).reduce((s, t) => s + t.amount, 0);
  return {
    revenue,
    completed: done.length,
    bookings: today.length,
    pending: today.filter((b) => b.status === "Pending" || b.status === "Confirmed").length,
    avg,
    repeat,
    fresh,
    walletToday,
    bonusToday,
    outstanding,
    reminderBookings: db.reminders.filter((r) => r.status === "Booked").length,
  };
}
