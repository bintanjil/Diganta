# Diganta · দিগন্ত

> **Money, time and goals — in one private app.**
> A cross-platform personal finance and lifestyle tracker built for Bangladesh. Offline-first, bilingual (English / বাংলা), with an on-device AI coach.

Diganta (Bengali for *horizon*) helps a regular person manage money, habits, time and goals in a
single app instead of juggling a banking app, a notes app and a habit tracker. It is **BDT-native**,
treats bKash / Nagad / Rocket as first-class payment methods, and keeps all your data on your device
by default.

<p align="center">
  <img src="assets/images/icon.png" width="120" alt="Diganta icon" />
</p>

---

## ✨ Features

### Money
- **Expenses & income** in ৳ BDT, with optional Bangla numerals (১২৩)
- **Payment methods**: Cash, bKash, Nagad, Rocket, Bank, Card
- **Categories** tuned for Bangladesh (Bazar, Rickshaw/CNG, Mobile Recharge, Bills, Eating Out…)
- **Budgets** per category with 80% warnings and over-limit alerts
- **Bills & recurring payments** with due tracking and reminders
- **Receipt photos** attached to any expense
- **Search & filter** your full history; tap to edit, long-press to delete
- **Reports**: monthly summary, category breakdown, payment-method split, 6-month trend

### Wealth
- **Goals planner** — e.g. *"buy a bike in 6 months"* → Diganta calculates the exact monthly saving,
  shows whether you're on track, and projects your real completion date
- **Savings buckets**: DPS, FDR, Bank, Committee/Somiti, cash at home
- **Investments**: stocks, mutual funds, gold, land, FDR, DPS, crypto — invested vs current value, gain/loss
- **Debts & loans**: who owes you and what you owe, with payment tracking

### Life
- **To-do list** with priority, category and due dates
- **Habit tracker** with streaks and a 7-day heatmap
- **Health log**: weight, water, sleep, calories, steps
- **Routine** blocks and **prayer times** (calculated from your location, Hanafi / Karachi method)

### AI
- **Coach** — a financial health score and personalised advice from your own data: overspend
  forecasts, category spikes, budget pace, bill due, debt load, habit streaks and goal pace
- **Learned profile** — Diganta classifies your money behaviour (disciplined saver, impulsive
  spender, rising saver…), scores four traits, and sets a monthly savings target
- **Ask Diganta** — a chat assistant that answers questions like *"How much did I spend on food?"*,
  *"Am I on track with my goals?"* or *"Forecast my spending"* — in English or Bangla
- Everything above runs **on-device**; no API key required

### Throughout
- **Bangla + English** UI with a language toggle
- **Day / Night / System** theme
- **Offline-first** — works with no connection
- **Backup & restore** — export/import a JSON file
- **Optional cloud sync** via Supabase (phone-number OTP)
- **PWA** — installs to the home screen on Android and iOS from a link

---

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 57 + React Native 0.86 (new architecture) |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| State | Zustand + AsyncStorage (persisted) |
| Charts / graphics | react-native-svg |
| Fonts | Inter, Playfair Display, Noto Sans/Serif Bengali |
| AI | On-device rules + heuristics engine (`src/lib/ai.ts`, `src/lib/profile.ts`, `src/lib/assistant.ts`) |
| Prayer times | [adhan-js](https://github.com/batoulapps/adhan-js) |
| Backend (optional) | [Supabase](https://supabase.com) — Postgres + Auth + RLS |
| Builds | EAS Build / EAS Submit |

---

## 📁 Project structure

```
src/
  app/                     # Expo Router routes
    (tabs)/                # Home, Money, Wealth, Life, Coach
    add.tsx                # Universal add/edit sheet (expense, goal, bill, debt…)
    assistant.tsx          # "Ask Diganta" AI chat
    onboarding.tsx         # First-run setup
    _layout.tsx            # Root layout, fonts, theme, protected routes
    +html.tsx              # Web HTML shell (PWA meta)
  components/              # UI kit (card, button, charts, progress, FAB…)
  constants/theme.ts       # Colors, fonts, spacing, shadows
  hooks/                   # useT (i18n), useTheme, useAppearance, useHydrated
  lib/
    analytics.ts           # Pure calculations (totals, budgets, goals, bills…)
    ai.ts                  # Advisor engine
    profile.ts             # Learned user profile
    assistant.ts           # Q&A engine for the chat
    catalog.ts             # Categories, payment methods, icons
    format.ts              # BDT currency, Bangla numerals, dates
    i18n.ts                # English + Bangla strings
    store.ts               # Zustand store + persistence
    supabase.ts / sync.ts  # Optional cloud sync
    backup.ts              # Export / import
supabase/schema.sql        # Database schema (snapshots + households)
docs/                      # Privacy policy, store listing
public/                    # PWA manifest + icons
scripts/generate-icons.js  # Regenerate app icons from SVG sources
```

---

## 🚀 Getting started

**Prerequisites:** Node.js 20.19+ and npm. A phone with [Expo Go](https://expo.dev/go) for quick testing.

```bash
npm install
npm run dev
```

Then press:
- `w` — open in the web browser
- `a` — Android (needs Android Studio / an emulator)
- `i` — iOS (macOS only)
- or **scan the QR code** with Expo Go on your phone

---

## 🔐 Environment (optional cloud sync)

The app runs fully offline with **no configuration**. To enable cloud sync, create a
[Supabase](https://supabase.com) project, run `supabase/schema.sql` in its SQL editor, then:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Without these keys, the Cloud Sync card simply shows "not configured".

---

## 🛠 Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Expo Go / web) |
| `npm run web` | Start in the browser |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run icons` | Regenerate app icons from `assets/brand/*.svg` |
| `npm run build:web` | Static web/PWA build → `dist/` |
| `npm run build:preview` | Android **APK** (shareable directly) |
| `npm run build:prod` | Store builds (`.aab` + `.ipa`) |
| `npm run submit:android` | Upload to Google Play |
| `npm run submit:ios` | Upload to App Store Connect |
| `npm run update` | Push an over-the-air JS update |

EAS commands are run through `npx eas-cli` so nothing needs a global install.

---

## 📦 Building & distribution

### Free / no store account
- **Web + PWA:** `npm run build:web`, then drop `dist/` on Netlify/Vercel/Cloudflare Pages.
  Users open the link and "Add to Home Screen" — works on **Android and iPhone**.
- **Android APK:** `npm run build:preview` → share the download link. Users install it directly.

### App stores
1. Create accounts: **Google Play Console** ($25 once) and **Apple Developer Program** ($99/yr).
2. `npm run eas:login` → `npm run eas:init`
3. `npm run build:prod`
4. `npm run submit:android` / `npm run submit:ios`

Store copy, keywords and data-safety answers are ready in [`docs/store-listing.md`](docs/store-listing.md).

---

## 🔒 Privacy

Your data is stored **on your device** by default. Cloud backup is optional and protected by
phone-number sign-in with row-level security. No ads, no data selling, no third-party trackers.
See [`docs/privacy-policy.md`](docs/privacy-policy.md).

---

## 🗺 Roadmap

- [ ] Push notifications in a dev/production build
- [ ] OCR for receipt scanning
- [ ] Recurring-transaction auto-posting
- [ ] CSV / PDF export
- [ ] Real-time shared household wallet
- [ ] Widgets and home-screen quick-add

---

## 📄 License

Released under the **MIT License** — see [LICENSE](LICENSE).

## 📬 Contact

Support: **support@diganta.app**

---

<p align="center"><em>Made for everyday life in Bangladesh. 🇧🇩</em></p>
