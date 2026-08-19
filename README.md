# Creative Salon

Mobile-first salon app for **Creative Salon, Pitampura, Delhi**.

Turns walk-ins into repeat customers: store-credit wallet, optional add-ons, smart reminders, trackable referrals, and a numbers-first owner dashboard.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build
npm run preview
```

## Try it

**Customer**
- Continue with any 10-digit mobile, or tap **Ankit / Neha / Rohit**
- Ankit has ₹500 paid + ₹50 bonus
- Book a service — add-ons are never pre-selected
- Top-up ₹500 to see paid + bonus ledger rows
- Refer & Earn code stays Pending until a paid first visit

**Owner**
- Open **Owner** from the header (no blank screen)
- Today’s revenue, bookings, avg bill, repeats, wallet, outstanding credit
- Create a walk-in, mark completed (next due date + reminder)
- Wallet ledger: every manual change needs a reason
- Settings + reports + reset demo data

## What is in the box

| Area | Behaviour |
| --- | --- |
| Wallet | Paid credit and bonus credit kept separate. Usable only at this salon. Not cash. |
| Bookings | Slot lock. Status: Pending, Confirmed, Completed, Cancelled, No-show |
| Add-ons | Beard Trim +₹99, Head Massage +₹199 — tap to add |
| Reminders | Default 25-day haircut cycle. One-tap Book Now + opt-out |
| Referrals | ₹100 / ₹100. Released only after first paid visit. Self-referral blocked |
| Data | Seeded staff, 10 services, 10 customers. Saved in `localStorage` |

Payments are simulated. No card or UPI details are stored.

## Deploy

This is a static Vite app (`base: "./"`).

- **Vercel / Netlify / Cloudflare Pages:** connect this repo, build command `npm run build`, output `dist`
- **GitHub Pages:** Actions workflow in `.github/workflows/pages.yml` publishes `dist` on every push to `main`

## Stack

React 19 · TypeScript · Vite 6 · localStorage (no backend required)
