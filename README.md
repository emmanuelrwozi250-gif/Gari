# Gari — Car Rental Marketplace for Rwanda 🚗

> Connecting Africa to the world — rent a car on your own terms.

A full-stack peer-to-peer and fleet car rental marketplace built for Rwanda, combining Turo + Careem for the African market. Pay with MTN MoMo, Airtel Money, or card.

---

## Features

- **P2P + Fleet rentals** — list your personal car or manage a fleet
- **Self-drive or with driver** — renters choose their preference
- **GPS location detection** — "Use My Location" powered by browser geolocation + Nominatim
- **Interactive maps** — Leaflet.js + OpenStreetMap (no API key required)
- **All 30 Rwanda districts** — with province grouping and popular location chips
- **Mobile money payments** — MTN MoMo, Airtel Money (mock, ready for real API)
- **Card payments** — Stripe integration
- **Multi-step host listing flow** — 5-step form with photo upload
- **Renter dashboard** — bookings, verification status, reviews
- **Host dashboard** — earnings chart, booking management, listings
- **Admin panel** — listing moderation, user management, GMV dashboard
- **Dark mode** — persisted to localStorage
- **Mobile-first** — bottom nav bar, slide-up filter drawer, swipeable cards
- **PWA-ready** — manifest + next-pwa

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| ORM | Prisma |
| Database | PostgreSQL (Supabase) |
| Auth | NextAuth.js (Google + Credentials) |
| Storage | Supabase Storage |
| Maps | Leaflet.js + OpenStreetMap |
| Payments | Stripe + MTN MoMo (mock) + Airtel Money (mock) |
| Email | Resend |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |

---

## Local Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/gari_db

NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

RESEND_API_KEY=re_...
```

### 4. Set up the database

```bash
# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Test Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Host (Kigali) | jean@gari.rw | password123 |
| Host (Musanze) | imma@gari.rw | password123 |
| Host (Rubavu) | david@gari.rw | password123 |
| Renter | amina@gari.rw | password123 |
| Admin | admin@gari.rw | password123 |

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for NextAuth (use `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your app URL (http://localhost:3000 in dev) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (for file uploads) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `RESEND_API_KEY` | Resend API key for email notifications |

---

## Prisma Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes to DB
npm run db:seed        # Seed with sample data
npm run db:studio      # Open Prisma Studio GUI
```

---

## Deploy to Vercel

1. Push to GitHub
2. Connect your repo in [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Deploy — Vercel auto-detects Next.js

```bash
# Or deploy via CLI
npx vercel --prod
```

---

## Project Structure

```
gari/
├── app/
│   ├── (public)/          # Public pages (no auth required)
│   │   ├── page.tsx       # Home page
│   │   ├── search/        # Browse & search cars
│   │   ├── cars/[id]/     # Car detail page
│   │   ├── host/          # Become a host landing
│   │   └── book/[carId]/  # Booking flow
│   ├── (auth)/            # Auth pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/         # Renter dashboard
│   │   └── host/          # Host dashboard
│   ├── host/new/          # List a car (multi-step form)
│   ├── admin/             # Admin panel
│   └── api/               # API routes
├── components/            # Shared React components
│   ├── MapView.tsx        # Leaflet map
│   ├── GPSButton.tsx      # GPS location detector
│   ├── LocationSelector.tsx
│   ├── SearchBar.tsx
│   ├── CarCard.tsx
│   ├── BookingCard.tsx
│   └── FilterSidebar.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── districts.ts       # All 30 Rwanda districts
│   ├── geocoding.ts       # Nominatim + Haversine
│   └── payments/          # MoMo, Airtel, Stripe
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

---

## Rwanda Districts

The app includes all **30 Rwanda districts** across 5 provinces with GPS coordinates, plus **10 popular pickup locations** (Kigali Airport, Volcanoes NP, Lake Kivu, etc.).

---

## Payment Integration

- **MTN MoMo** — Mock implementation ready for [MTN Rwanda MoMo API](https://momodeveloper.mtn.com)
- **Airtel Money** — Mock implementation ready for [Airtel Africa API](https://developers.airtel.africa)
- **Stripe** — Full integration with Payment Intents
- All prices in **RWF (Rwandan Franc)**

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT © Gari Technologies Ltd
# Gari
