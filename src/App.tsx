import { useEffect, useMemo, useState } from "react";
import {
  type Addon,
  type Customer,
  type DB,
  SLOTS,
  TODAY,
  addCustomer,
  adjustWallet,
  createBooking,
  dashboard,
  ensureReferral,
  inr,
  loadDB,
  lookupOrCreate,
  resetDB,
  saveDB,
  setConsent,
  setStatus,
  topUp,
  sendAgentTurn,
} from "./store";
import { identify, tag, track } from "./clarity";

type Role = "customer" | "owner";
type CView = "login" | "home" | "book" | "wallet" | "bookings" | "refer" | "profile" | "chat";
type OView = "dash" | "bookings" | "customers" | "wallet" | "settings" | "reports" | "messages";

const DEMOS = [
  { phone: "9876543210", name: "Ankit Mehra" },
  { phone: "9812345678", name: "Neha Gupta" },
  { phone: "9765432109", name: "Rohit Singh" },
];

function toast(set: (s: string) => void, msg: string) {
  set(msg);
  window.setTimeout(() => set(""), 2600);
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="logo">C</div>
      <div>
        <h1>Creative</h1>
        {!compact && <p>Pitampura · Delhi</p>}
      </div>
    </div>
  );
}

function Chip({ status }: { status: string }) {
  const cls =
    status === "Completed" ? "ok" : status === "Confirmed" ? "info" : status === "Cancelled" || status === "No-show" ? "bad" : "warn";
  return <span className={`chip ${cls}`}>{status}</span>;
}

export function App() {
  const [db, setDb] = useState<DB>(() => loadDB());
  const [role, setRole] = useState<Role>("customer");
  const [cView, setCView] = useState<CView>("login");
  const [oView, setOView] = useState<OView>("dash");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const customer = db.customers.find((c) => c.id === customerId) ?? null;
  const refresh = (next: DB) =>
    setDb({
      ...next,
      customers: [...next.customers],
      bookings: [...next.bookings],
      txs: [...next.txs],
      reminders: [...next.reminders],
      messages: [...(next.messages ?? [])],
    });

  useEffect(() => {
    const saved = sessionStorage.getItem("cs-customer");
    if (saved && db.customers.some((c) => c.id === saved)) {
      setCustomerId(saved);
      setCView("home");
    }
  }, []);

  useEffect(() => {
    tag("app", "creative-salon");
    tag("role", role);
    const screen = role === "customer" ? cView : `owner_${oView}`;
    tag("screen", screen);
    track(`view_${screen}`);
    if (customer) {
      tag("demo_user", customer.name);
      identify(customer.id, customer.name);
    }
  }, [role, cView, oView, customerId]);

  function enter(phone: string, name?: string) {
    try {
      const c = lookupOrCreate(db, phone, name);
      refresh(db);
      setCustomerId(c.id);
      sessionStorage.setItem("cs-customer", c.id);
      setCView("home");
      track(name ? "demo_guest" : "phone_login");
      toast(setMsg, `Welcome, ${c.name.split(" ")[0]}`);
    } catch (e) {
      toast(setMsg, e instanceof Error ? e.message : "Lookup failed");
    }
  }

  return (
    <div className="frame">
      {role === "customer" ? (
        <CustomerApp
          db={db}
          customer={customer}
          view={cView}
          setView={setCView}
          onOwner={() => {
            setRole("owner");
            setOView("dash");
            track("open_owner_desk");
          }}
          onEnter={enter}
          onRefresh={() => refresh(db)}
          onLogout={() => {
            setCustomerId(null);
            sessionStorage.removeItem("cs-customer");
            setCView("login");
          }}
          toast={(m) => toast(setMsg, m)}
        />
      ) : (
        <OwnerApp
          db={db}
          view={oView}
          setView={setOView}
          onCustomer={() => setRole("customer")}
          onRefresh={() => refresh(db)}
          toast={(m) => toast(setMsg, m)}
        />
      )}
      {msg && <div className="toast">{msg}</div>}
    </div>
  );
}

function CustomerApp({
  db,
  customer,
  view,
  setView,
  onOwner,
  onEnter,
  onRefresh,
  onLogout,
  toast,
}: {
  db: DB;
  customer: Customer | null;
  view: CView;
  setView: (v: CView) => void;
  onOwner: () => void;
  onEnter: (phone: string, name?: string) => void;
  onRefresh: () => void;
  onLogout: () => void;
  toast: (m: string) => void;
}) {
  return (
    <>
      <header className="header">
        <Brand compact={view !== "login"} />
        {view !== "login" && (
          <div className="header-links">
            <button className="link" onClick={() => setView("profile")}>
              Profile
            </button>
            <button className="link" onClick={onOwner}>
              Owner
            </button>
          </div>
        )}
      </header>
      <main className={`content${view === "login" ? " login" : ""}`}>
        {view === "login" && <Login onEnter={onEnter} onOwner={onOwner} />}
        {view === "home" && customer && (
          <Home db={db} customer={customer} setView={setView} onRefresh={onRefresh} toast={toast} />
        )}
        {view === "book" && customer && <Book db={db} customer={customer} setView={setView} onRefresh={onRefresh} toast={toast} />}
        {view === "wallet" && customer && <Wallet db={db} customer={customer} onRefresh={onRefresh} toast={toast} />}
        {view === "bookings" && customer && <MyBookings db={db} customer={customer} setView={setView} />}
        {view === "refer" && customer && <Refer db={db} customer={customer} />}
        {view === "profile" && customer && (
          <Profile db={db} customer={customer} onRefresh={onRefresh} onLogout={onLogout} toast={toast} />
        )}
        {view === "chat" && customer && (
          <CustomerChat db={db} customer={customer} onRefresh={onRefresh} toast={toast} />
        )}
        {view !== "login" && !customer && <Login onEnter={onEnter} onOwner={onOwner} />}
      </main>
      {view !== "login" && customer && (
        <nav className="nav">
          {(
            [
              ["home", "Home"],
              ["book", "Book"],
              ["wallet", "Wallet"],
              ["bookings", "Visits"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}>
              <NavIcon name={id} />
              {label}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}

function NavIcon({ name }: { name: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "home" || name === "dash") {
    return (
      <svg viewBox="0 0 24 24" {...p}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (name === "book" || name === "bookings") {
    return (
      <svg viewBox="0 0 24 24" {...p}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }
  if (name === "wallet") {
    return (
      <svg viewBox="0 0 24 24" {...p}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M16 12.5h.01M3 10h18" />
      </svg>
    );
  }
  if (name === "messages" || name === "chat") {
    return (
      <svg viewBox="0 0 24 24" {...p}>
        <path d="M4 6.5h10.5A1.5 1.5 0 0 1 16 8v5.5a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3H5.5A1.5 1.5 0 0 1 4 13.5z" />
        <path d="M16 9.5h3.5A1.5 1.5 0 0 1 21 11v6.5L18 15h-2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M4 19c.6-3 2.8-4.5 5-4.5s4.4 1.5 5 4.5M16 11h5M18.5 8.5v5" />
    </svg>
  );
}

function Login({ onEnter, onOwner }: { onEnter: (p: string, n?: string) => void; onOwner: () => void }) {
  const [phone, setPhone] = useState("");
  return (
    <>
      <div className="hero-shot">
        <img src="./salon-hero.jpg" alt="Creative Salon, Pitampura" />
      </div>
      <span className="kicker">Pitampura · Delhi</span>
      <h2 className="hero-title">Your salon. On your phone.</h2>
      <p className="lede">Book Rajesh. Keep a wallet. WhatsApp goes in your salon’s name — not Billu’s.</p>
      <label className="field" style={{ marginTop: 22 }}>
        <span>Mobile number</span>
        <input inputMode="numeric" maxLength={10} placeholder="98765 43210" data-clarity-mask="true" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
      </label>
      <button className="btn btn-primary" onClick={() => onEnter(phone)}>
        Continue
      </button>
      <p className="kicker" style={{ marginTop: 26, marginBottom: 4 }}>
        Try a guest
      </p>
      {DEMOS.map((d) => (
        <button key={d.phone} className="btn btn-ghost demo-btn" onClick={() => onEnter(d.phone, d.name)}>
          <span className="who">{d.name}</span>
          <span className="ph">{d.phone}</span>
        </button>
      ))}
      <p style={{ textAlign: "center", marginTop: 22 }}>
        <button className="link" onClick={onOwner}>
          Open owner desk
        </button>
      </p>
    </>
  );
}

function Home({
  db,
  customer,
  setView,
  onRefresh,
  toast,
}: {
  db: DB;
  customer: Customer;
  setView: (v: CView) => void;
  onRefresh: () => void;
  toast: (m: string) => void;
}) {
  const due = db.reminders.find((r) => r.customerId === customer.id && r.status === "Scheduled");
  const done = db.bookings.filter((b) => b.customerId === customer.id && b.status === "Completed");
  return (
    <>
      <div className="wallet">
        <div className="kicker">Salon wallet</div>
        <div className="amt tabular">{inr(customer.paidCredit + customer.bonusCredit)}</div>
        <div className="split">
          <div>
            Paid<strong className="tabular">{inr(customer.paidCredit)}</strong>
          </div>
          <div>
            Bonus<strong className="tabular">{inr(customer.bonusCredit)}</strong>
          </div>
        </div>
        <button className="btn btn-sm btn-outline" style={{ marginTop: 16 }} onClick={() => setView("wallet")}>
          View ledger
        </button>
      </div>
      {due && customer.consent && (
        <div className="reminder">
          <h3>{db.services.find((s) => s.id === due.serviceId)?.name} due soon</h3>
          <p>Suggested around {due.dueDate}. Cycle is {db.settings.reminderDays} days for haircuts.</p>
          <button className="btn btn-accent btn-sm" onClick={() => setView("book")}>
            Book Now
          </button>{" "}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setConsent(db, customer.id, false);
              onRefresh();
              track("reminder_opt_out");
              toast("Opted out of reminder messages");
            }}
          >
            Opt-out
          </button>
        </div>
      )}
      <button className="btn btn-primary" onClick={() => setView("book")}>
        Book a service
      </button>
      <div className="grid2" style={{ marginTop: 12 }}>
        <button className="card press" onClick={() => setView("refer")}>
          <div className="kicker">Refer</div>
          <strong>₹100 credit</strong>
          <div className="muted">For you and a friend</div>
        </button>
        <button className="card press" onClick={() => setView("bookings")}>
          <div className="kicker">Visits</div>
          <strong>{db.bookings.filter((b) => b.customerId === customer.id).length}</strong>
          <div className="muted">Booking history</div>
        </button>
      </div>
      <button className="card press" style={{ marginTop: 10 }} onClick={() => setView("chat")}>
        <div className="kicker">WhatsApp</div>
        <strong>Message the salon</strong>
        <div className="muted">Hindi text agent · “Kal 4 baje Rajesh?”</div>
      </button>
      <h3 className="section-title" style={{ marginTop: 20 }}>Recent visits</h3>
      <div className="card">
        {done.length === 0 && <div className="empty">No visits yet. Book your first service.</div>}
        {done.slice(0, 4).map((b) => (
          <div className="row" key={b.id}>
            <div>
              <strong>{db.services.find((s) => s.id === b.serviceId)?.name}</strong>
              <div className="muted">
                {b.date} · {db.staff.find((s) => s.id === b.staffId)?.name} · {inr(b.total)}
              </div>
            </div>
            <Chip status="Completed" />
          </div>
        ))}
      </div>
    </>
  );
}

function Book({
  db,
  customer,
  setView,
  onRefresh,
  toast,
}: {
  db: DB;
  customer: Customer;
  setView: (v: CView) => void;
  onRefresh: () => void;
  toast: (m: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(customer.preferredStaff);
  const [date, setDate] = useState("2026-08-21");
  const [slot, setSlot] = useState<string | null>(null);
  const [addons, setAddons] = useState<Addon[]>([]);
  const svc = db.services.find((s) => s.id === serviceId);
  const catalog = db.services
    .filter((s) => (s.id === "svc_03" || s.id === "svc_04") && s.id !== serviceId)
    .map((s) => ({ id: s.id, name: s.name, price: s.price, duration: s.duration }));
  const total = (svc?.price ?? 0) + addons.reduce((n, a) => n + a.price, 0);
  const dur = (svc?.duration ?? 0) + addons.reduce((n, a) => n + a.duration, 0);

  return (
    <>
      <div className="steps">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`dot ${n <= step ? "on" : ""}`} />
        ))}
      </div>
      {step === 1 && (
        <>
          <h2>Choose service</h2>
          <div className="grid2" style={{ marginTop: 12 }}>
            {db.services.map((s) => (
              <button
                key={s.id}
                className={`pick ${serviceId === s.id ? "on" : ""}`}
                onClick={() => {
                  setServiceId(s.id);
                  setAddons([]);
                  setStep(2);
                }}
              >
                <div className="n">{s.name}</div>
                <div className="m">
                  {inr(s.price)} · {s.duration} min
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <h2>Barber & slot</h2>
          <div className="grid2" style={{ marginTop: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
            {db.staff.map((s) => (
              <button key={s.id} className={`pick ${staffId === s.id ? "on" : ""}`} onClick={() => setStaffId(s.id)}>
                <div className="n">{s.name.split(" ")[0]}</div>
                <div className="m">{s.role}</div>
              </button>
            ))}
          </div>
          <label className="field" style={{ marginTop: 12 }}>
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            {SLOTS.map((s) => (
              <button key={s} className={`pick ${slot === s ? "on" : ""}`} onClick={() => setSlot(s)}>
                <div className="n">{s}</div>
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => {
              if (!staffId || !slot) return toast("Select staff and a slot");
              setStep(3);
            }}
          >
            Next: add-ons
          </button>
        </>
      )}
      {step === 3 && (
        <>
          <h2>Optional add-ons</h2>
          <p className="muted">None are pre-selected.</p>
          {catalog.map((a) => {
            const on = addons.some((x) => x.id === a.id);
            return (
              <button
                key={a.id}
                className={`pick ${on ? "on" : ""}`}
                style={{ width: "100%", marginTop: 8, display: "flex", justifyContent: "space-between" }}
                onClick={() => {
                  setAddons((p) => (on ? p.filter((x) => x.id !== a.id) : [...p, a]));
                  track(on ? "addon_removed" : "addon_added");
                }}
              >
                <span>
                  <strong>{a.name}</strong>
                  <div className="muted">+{a.duration} min</div>
                </span>
                <strong style={{ color: "var(--primary)" }}>+{inr(a.price)}</strong>
              </button>
            );
          })}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="row">
              <span className="muted">Service</span>
              <span>
                {svc?.name} {inr(svc?.price ?? 0)}
              </span>
            </div>
            {addons.map((a) => (
              <div className="row" key={a.id}>
                <span className="muted">{a.name}</span>
                <span>+{inr(a.price)}</span>
              </div>
            ))}
            <div className="row">
              <strong>Total</strong>
              <strong className="tabular" style={{ color: "var(--primary)" }}>
                {inr(total)}
              </strong>
            </div>
            <div className="muted">Duration {dur} min</div>
          </div>
          <button className="btn btn-primary" onClick={() => setStep(4)}>
            Review & confirm
          </button>
        </>
      )}
      {step === 4 && (
        <>
          <h2>Confirm booking</h2>
          <div className="card">
            <strong>{svc?.name}</strong>
            <p className="muted">
              {date} · {slot} · {db.staff.find((s) => s.id === staffId)?.name}
            </p>
            {addons.length > 0 && <p>Add-ons: {addons.map((a) => a.name).join(", ")}</p>}
            <h3 className="tabular" style={{ color: "var(--primary)", fontSize: 26 }}>
              {inr(total)}
            </h3>
            <p className="muted">Pay at salon or use wallet credit. No charge now.</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              try {
                createBooking(db, {
                  customerId: customer.id,
                  serviceId: serviceId!,
                  staffId: staffId!,
                  date,
                  slot: slot!,
                  addons,
                  createdBy: "customer",
                });
                onRefresh();
                track("booking_confirmed");
                toast(`Booking confirmed. WhatsApp sent (simulated).`);
                setView("bookings");
              } catch (e) {
                toast(e instanceof Error ? e.message : "Could not book");
              }
            }}
          >
            Confirm booking
          </button>
          <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => setStep(3)}>
            Back
          </button>
        </>
      )}
    </>
  );
}

function Wallet({ db, customer, onRefresh, toast }: { db: DB; customer: Customer; onRefresh: () => void; toast: (m: string) => void }) {
  const txs = db.txs.filter((t) => t.customerId === customer.id);
  return (
    <>
      <div className="wallet">
        <div className="kicker">Usable credit</div>
        <div className="amt tabular">{inr(customer.paidCredit + customer.bonusCredit)}</div>
        <div className="split">
          <div>
            Paid<strong>{inr(customer.paidCredit)}</strong>
          </div>
          <div>
            Bonus<strong>{inr(customer.bonusCredit)}</strong>
          </div>
        </div>
      </div>
      <p className="muted">Credit is usable only at Creative Salon, Pitampura. Cannot be withdrawn as cash.</p>
      <button
        className="btn btn-primary"
        onClick={() => {
          const r = topUp(db, customer.id, 500);
          onRefresh();
          track("wallet_topup");
          toast(`₹${r.pay + r.bonus} credited. WhatsApp receipt sent (simulated).`);
        }}
      >
        Top-up ₹500 (get ₹50 bonus)
      </button>
      <h3 style={{ margin: "16px 0 8px" }}>Transaction history</h3>
      <div className="card">
        {txs.length === 0 && <div className="empty">No transactions yet. Top-up to get bonus credit.</div>}
        {txs.map((t) => (
          <div className="row" key={t.id}>
            <div>
              <strong style={{ textTransform: "uppercase", fontSize: 13 }}>{t.type.replaceAll("_", " ")}</strong>
              <div className="muted">{t.reason}</div>
            </div>
            <strong style={{ color: t.type.includes("credit") ? "var(--success)" : "var(--danger)" }}>
              {t.type.includes("credit") ? "+" : "-"}
              {inr(t.amount)}
            </strong>
          </div>
        ))}
      </div>
    </>
  );
}

function MyBookings({ db, customer, setView }: { db: DB; customer: Customer; setView: (v: CView) => void }) {
  const rows = db.bookings.filter((b) => b.customerId === customer.id);
  return (
    <>
      <button className="btn btn-primary" onClick={() => setView("book")}>
        New booking
      </button>
      <div className="card" style={{ marginTop: 12 }}>
        {rows.length === 0 && <div className="empty">No bookings yet</div>}
        {rows.map((b) => (
          <div className="row" key={b.id}>
            <div>
              <strong>{db.services.find((s) => s.id === b.serviceId)?.name}</strong>
              <div className="muted">
                {b.date} · {b.slot} · {db.staff.find((s) => s.id === b.staffId)?.name} · {inr(b.total)}
              </div>
            </div>
            <Chip status={b.status} />
          </div>
        ))}
      </div>
    </>
  );
}

function Refer({ db, customer }: { db: DB; customer: Customer }) {
  const mine = useMemo(() => ensureReferral(db, customer.id), [db, customer.id]);
  return (
    <>
      <div className="card" style={{ textAlign: "center" }}>
        <div className="muted">Your unique code</div>
        <h2 style={{ letterSpacing: "0.08em", margin: "10px 0", fontSize: 28 }}>{mine.code}</h2>
        <p className="muted">You get ₹100 salon credit. They get ₹100 off the first paid visit. Reward stays Pending until that visit is completed.</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            void navigator.clipboard?.writeText(`Use my code ${mine.code} at Creative Salon, Pitampura & get ₹100 off!`);
            track("referral_share");
          }}
        >
          Copy share link
        </button>
      </div>
      <ol className="muted">
        <li>Friend books using your code</li>
        <li>They complete the first paid visit</li>
        <li>Both rewards release (not before)</li>
      </ol>
    </>
  );
}

function Profile({
  db,
  customer,
  onRefresh,
  onLogout,
  toast,
}: {
  db: DB;
  customer: Customer;
  onRefresh: () => void;
  onLogout: () => void;
  toast: (m: string) => void;
}) {
  return (
    <>
      <div className="card">
        <h2>{customer.name}</h2>
        <p className="muted">+91 {customer.phone}</p>
        <div className="row">
          <span className="muted">Last visit</span>
          <span>{customer.lastVisit ?? "—"}</span>
        </div>
        <div className="row">
          <span className="muted">Total visits</span>
          <span>{customer.visits}</span>
        </div>
        <div className="row">
          <span className="muted">Wallet</span>
          <span>{inr(customer.paidCredit + customer.bonusCredit)}</span>
        </div>
      </div>
      <label className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>
          <strong>Promotional messages</strong>
          <div className="muted">Reminders and offers via WhatsApp</div>
        </span>
        <input
          type="checkbox"
          checked={customer.consent}
          onChange={(e) => {
            setConsent(db, customer.id, e.target.checked);
            onRefresh();
            toast(e.target.checked ? "Consent enabled" : "Opted out of promotional messages");
          }}
        />
      </label>
      <button className="btn btn-outline" onClick={onLogout}>
        Switch customer number
      </button>
    </>
  );
}


function CustomerChat({
  db,
  customer,
  onRefresh,
  toast,
}: {
  db: DB;
  customer: Customer;
  onRefresh: () => void;
  toast: (m: string) => void;
}) {
  const [text, setText] = useState("");
  const mine = (db.messages ?? []).filter((m) => m.customerId === customer.id).slice().reverse();
  return (
    <>
      <span className="kicker">Simulated WhatsApp</span>
      <h2 className="section-title">Salon chat</h2>
      <p className="muted">Creative Salon ke naam se. Marketplace nahi. Try: “Kal 4 baje Rajesh?”</p>
      <div className="wa-thread">
        {mine.length === 0 && <div className="empty">Abhi koi message nahi.</div>}
        {mine.map((m) => (
          <div key={m.id} className={`wa-bubble ${m.direction}`}>
            <p>{m.body}</p>
            <span>
              {m.at} · {m.status}
            </span>
          </div>
        ))}
      </div>
      <form
        className="wa-compose"
        onSubmit={(e) => {
          e.preventDefault();
          const q = text.trim();
          if (!q) return;
          try {
            sendAgentTurn(db, customer.id, q);
            onRefresh();
            setText("");
            track("wa_agent");
          } catch (err) {
            toast(err instanceof Error ? err.message : "Could not send");
          }
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type on WhatsApp…" />
        <button className="btn btn-primary btn-sm" type="submit">
          Send
        </button>
      </form>
    </>
  );
}

function OwnerInbox({ db }: { db: DB }) {
  const [filter, setFilter] = useState<"all" | "Sent" | "Held" | "agent">("all");
  const rows = (db.messages ?? []).filter((m) => {
    if (filter === "all") return true;
    if (filter === "agent") return m.kind === "agent";
    return m.status === filter;
  });
  return (
    <>
      <span className="kicker">Your clients · your name</span>
      <h2 className="section-title">WhatsApp inbox</h2>
      <p className="muted">Demo only. Real WhatsApp Business API is connected when a salon says yes. Opt-out is respected.</p>
      <div className="wa-filters">
        {(["all", "Sent", "Held", "agent"] as const).map((f) => (
          <button key={f} className={`chip ${filter === f ? "info" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "Held" ? "Held / opt-out" : f === "agent" ? "Agent" : "Sent"}
          </button>
        ))}
      </div>
      {rows.length === 0 && <div className="empty">No messages in this filter.</div>}
      {rows.map((m) => {
        const c = db.customers.find((x) => x.id === m.customerId);
        return (
          <div className="card wa-card" key={m.id}>
            <div className="row" style={{ paddingTop: 0 }}>
              <div>
                <strong>{c?.name ?? "Client"}</strong>
                <div className="muted">
                  +91 {c?.phone} · {m.kind} · {m.direction === "in" ? "in" : "out"}
                </div>
              </div>
              <span className={`chip ${m.status === "Sent" ? "ok" : m.status === "Held" ? "bad" : "warn"}`}>{m.status}</span>
            </div>
            <p className="wa-body">{m.body}</p>
            <div className="muted">
              {m.at}
              {m.note ? ` · ${m.note}` : ""}
            </div>
          </div>
        );
      })}
    </>
  );
}

function OwnerApp({
  db,
  view,
  setView,
  onCustomer,
  onRefresh,
  toast,
}: {
  db: DB;
  view: OView;
  setView: (v: OView) => void;
  onCustomer: () => void;
  onRefresh: () => void;
  toast: (m: string) => void;
}) {
  const dash = dashboard(db);
  return (
    <>
      <header className="header">
        <Brand compact />
        <button className="link" onClick={onCustomer}>
          Customer
        </button>
      </header>
      <main className="content">
        {view === "dash" && (
          <>
            <span className="kicker">Today at the salon</span>
            <h2 className="section-title">Owner desk</h2>
            <p className="muted">Creative · Pitampura, Delhi</p>
            <div className="grid2" style={{ marginTop: 16 }}>
              {[
                ["Today's revenue", inr(dash.revenue), `${dash.completed} completed`],
                ["Bookings today", String(dash.bookings), `${dash.pending} pending`],
                ["Avg bill value", inr(dash.avg), "completed visits"],
                ["Repeat customers", String(dash.repeat), "of completed today"],
                ["New customers", String(dash.fresh), "today"],
                ["Wallet collected", inr(dash.walletToday), `+ ${inr(dash.bonusToday)} bonus`],
                ["Outstanding credit", inr(dash.outstanding), "salon-wide"],
                ["Reminder bookings", String(dash.reminderBookings), "from reminders"],
                ["WhatsApp sent", String(dash.waSent), `${dash.waHeld} held / opted-out`],
              ].map(([l, v, s]) => (
                <div className="metric" key={l}>
                  <div className="lab">{l}</div>
                  <div className="val tabular">{v}</div>
                  <div className="sub">{s}</div>
                </div>
              ))}
            </div>
            <div className="grid2">
              <button className="btn btn-primary" onClick={() => { track("open_inbox"); setView("messages"); }}>
                WhatsApp inbox
              </button>
              <button className="btn btn-outline" onClick={() => setView("bookings")}>
                Manage bookings
              </button>
              <button className="btn btn-outline" onClick={() => setView("customers")}>
                Customers
              </button>
              <button className="btn btn-outline" onClick={() => setView("wallet")}>
                Wallet ledger
              </button>
            </div>
            <p>
              <button className="link" onClick={() => setView("settings")}>
                Settings
              </button>
            </p>
            <p>
              <button className="link" onClick={() => setView("reports")}>
                Open reports
              </button>
            </p>
            <h3>Today's bookings</h3>
            <div className="card">
              {db.bookings.filter((b) => b.date === TODAY).length === 0 && <div className="empty">No data for today yet</div>}
              {db.bookings
                .filter((b) => b.date === TODAY)
                .map((b) => (
                  <div className="row" key={b.id}>
                    <div>
                      <strong>
                        {db.customers.find((c) => c.id === b.customerId)?.name} · {db.services.find((s) => s.id === b.serviceId)?.name}
                      </strong>
                      <div className="muted">
                        {b.slot} · {inr(b.total)}
                      </div>
                    </div>
                    <Chip status={b.status} />
                  </div>
                ))}
            </div>
          </>
        )}
        {view === "bookings" && <OwnerBookings db={db} onRefresh={onRefresh} toast={toast} />}
        {view === "customers" && <OwnerCustomers db={db} onRefresh={onRefresh} toast={toast} />}
        {view === "wallet" && <OwnerWallet db={db} onRefresh={onRefresh} toast={toast} />}
        {view === "settings" && <OwnerSettings db={db} onRefresh={onRefresh} toast={toast} />}
        {view === "reports" && <OwnerReports db={db} />}
        {view === "messages" && <OwnerInbox db={db} />}
      </main>
      <nav className="nav">
        {(
          [
            ["dash", "Desk"],
            ["messages", "Inbox"],
            ["bookings", "Bookings"],
            ["customers", "Clients"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}>
            <NavIcon name={id === "customers" ? "clients" : id} />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}

function OwnerBookings({ db, onRefresh, toast }: { db: DB; onRefresh: () => void; toast: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerId: db.customers[0]?.id ?? "", serviceId: db.services[0]?.id ?? "", staffId: db.staff[0]?.id ?? "", date: TODAY, slot: "10:00" });
  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
        + Create walk-in
      </button>
      {open && (
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              createBooking(db, { ...form, addons: [], createdBy: "owner" });
              onRefresh();
              setOpen(false);
              track("owner_walkin");
              toast("Walk-in booked");
            } catch (err) {
              toast(err instanceof Error ? err.message : "Could not book");
            }
          }}
        >
          <label className="field">
            <span>Customer</span>
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              {db.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Service</span>
            <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
              {db.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Staff</span>
            <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
              {db.staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid2">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })}>
              {SLOTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 10 }} type="submit">
            Save walk-in
          </button>
        </form>
      )}
      {db.bookings.map((b) => (
        <div className="card" key={b.id}>
          <div className="row">
            <div>
              <strong>{db.customers.find((c) => c.id === b.customerId)?.name}</strong>
              <div className="muted">
                {db.services.find((s) => s.id === b.serviceId)?.name} · {db.staff.find((s) => s.id === b.staffId)?.name} · {b.date} {b.slot} · {inr(b.total)}
              </div>
            </div>
            <Chip status={b.status} />
          </div>
          {b.status !== "Completed" && b.status !== "Cancelled" && (
            <div className="tiny">
              <button
                onClick={() => {
                  setStatus(db, b.id, "Completed");
                  onRefresh();
                  track("owner_complete_visit");
                  toast("Visit completed. Next due date calculated. Reminder scheduled.");
                }}
              >
                Mark completed
              </button>
              {b.status === "Confirmed" && (
                <>
                  <button
                    onClick={() => {
                      setStatus(db, b.id, "Cancelled");
                      onRefresh();
                      toast("Status updated to Cancelled");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setStatus(db, b.id, "No-show");
                      onRefresh();
                      toast("Status updated to No-show");
                    }}
                  >
                    No-show
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function OwnerCustomers({ db, onRefresh, toast }: { db: DB; onRefresh: () => void; toast: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
        + Add customer
      </button>
      {open && (
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              addCustomer(db, name, phone);
              onRefresh();
              setName("");
              setPhone("");
              setOpen(false);
              toast("Customer added");
            } catch (err) {
              toast(err instanceof Error ? err.message : "Could not add");
            }
          }}
        >
          <input className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="field" placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <button className="btn btn-primary" type="submit">
            Save
          </button>
        </form>
      )}
      <div className="card">
        {db.customers.map((c) => (
          <div className="row" key={c.id}>
            <div>
              <strong>{c.name}</strong>
              <div className="muted">
                +91 {c.phone} · {c.visits} visits · {inr(c.paidCredit + c.bonusCredit)}
              </div>
            </div>
            <span className={`chip ${c.consent ? "ok" : "bad"}`}>{c.consent ? "Consent" : "Opt-out"}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function OwnerWallet({ db, onRefresh, toast }: { db: DB; onRefresh: () => void; toast: (m: string) => void }) {
  const [customerId, setCustomerId] = useState(db.customers[0]?.id ?? "");
  const [amount, setAmount] = useState("100");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"credit_paid" | "debit" | "reversal">("credit_paid");
  return (
    <>
      <p className="muted">Immutable history. Manual adjustments require a reason. Never delete — only reverse.</p>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            adjustWallet(db, customerId, type, Number(amount), reason);
            onRefresh();
            setReason("");
            toast("Adjustment recorded with reason");
          } catch (err) {
            toast(err instanceof Error ? err.message : "Failed");
          }
        }}
      >
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          {db.customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="grid2" style={{ margin: "8px 0" }}>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="credit_paid">Credit</option>
            <option value="debit">Debit</option>
            <option value="reversal">Reversal</option>
          </select>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <input placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button className="btn btn-primary" style={{ marginTop: 10 }} type="submit">
          Record adjustment
        </button>
      </form>
      <div className="card">
        {db.txs.map((t) => (
          <div className="row" key={t.id}>
            <div>
              <strong>
                {db.customers.find((c) => c.id === t.customerId)?.name} · {t.type.replaceAll("_", " ")}
              </strong>
              <div className="muted">{t.reason}</div>
            </div>
            <strong style={{ color: t.type.includes("credit") ? "var(--success)" : "var(--danger)" }}>
              {t.type.includes("credit") ? "+" : "-"}
              {inr(t.amount)}
            </strong>
          </div>
        ))}
      </div>
    </>
  );
}

function OwnerSettings({ db, onRefresh, toast }: { db: DB; onRefresh: () => void; toast: (m: string) => void }) {
  const s = db.settings;
  return (
    <>
      <div className="card">
        <div className="muted">Salon</div>
        <h2>{s.salonName}</h2>
        <p className="muted">{s.location}</p>
      </div>
      {(
        [
          ["Min top-up", "minTopup"],
          ["Bonus on ₹500", "bonusFixed"],
          ["Credit expiry days", "expiryDays"],
          ["Haircut reminder days", "reminderDays"],
          ["Referrer credit", "refReferrer"],
          ["New customer off", "refReferee"],
        ] as const
      ).map(([label, key]) => (
        <label className="field" key={key}>
          <span>{label}</span>
          <input
            type="number"
            value={s[key]}
            onChange={(e) => {
              s[key] = Number(e.target.value);
              saveDB(db);
              onRefresh();
            }}
          />
        </label>
      ))}
      <button
        className="btn btn-primary"
        onClick={() => {
          localStorage.setItem("creative-salon-v1", JSON.stringify(db));
          toast("Settings saved");
        }}
      >
        Save settings
      </button>
      <button
        className="btn btn-outline"
        style={{ marginTop: 8 }}
        onClick={() => {
          resetDB();
          window.location.reload();
        }}
      >
        Reset demo data
      </button>
    </>
  );
}

function OwnerReports({ db }: { db: DB }) {
  const barbers = db.staff.map((st) => {
    const jobs = db.bookings.filter((b) => b.staffId === st.id && b.status === "Completed");
    return { name: st.name, jobs: jobs.length, revenue: jobs.reduce((s, b) => s + b.total, 0) };
  });
  const popular = db.services
    .map((s) => ({ name: s.name, n: db.bookings.filter((b) => b.serviceId === s.id).length }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n);
  const missed = db.bookings.filter((b) => b.status === "Cancelled" || b.status === "No-show");
  return (
    <>
      <h2>Reports</h2>
      <div className="card">
        <div className="muted">Barber performance</div>
        {barbers.map((b) => (
          <div className="row" key={b.name}>
            <span>{b.name}</span>
            <span className="tabular">
              {b.jobs} · {inr(b.revenue)}
            </span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="muted">Top customers</div>
        {[...db.customers]
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 5)
          .map((c) => (
            <div className="row" key={c.id}>
              <span>{c.name}</span>
              <span>
                {c.visits} visits · {inr(c.paidCredit + c.bonusCredit)}
              </span>
            </div>
          ))}
      </div>
      <div className="card">
        <div className="muted">Popular services</div>
        {popular.map((s) => (
          <div className="row" key={s.name}>
            <span>{s.name}</span>
            <span>{s.n}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="muted">Cancellations & no-shows</div>
        {missed.length === 0 && <div className="empty">None yet</div>}
        {missed.map((b) => (
          <div className="row" key={b.id}>
            <span>{db.customers.find((c) => c.id === b.customerId)?.name}</span>
            <Chip status={b.status} />
          </div>
        ))}
      </div>
    </>
  );
}
