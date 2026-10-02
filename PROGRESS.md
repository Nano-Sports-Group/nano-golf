# PROGRESS.md — Nano Fotboll Golf
> Senast uppdaterad: 2026-06-07

## Statusöversikt

### Fas 1 — Scaffold ✅ KLAR
- Next.js 16, Clerk, Stripe, Supabase, Framer Motion, Recharts
- Layout med Header + MobileNav + MotionProvider
- Landing page (app/page.tsx) — hero, features, pricing

### Fas 2 — Core routes ✅ KLAR
- (app)/nyheter — artikelfeed med TopCarousel + FilterPills
- (app)/nyheter/[slug] — artikel-detailsida (via API)
- (app)/spelare — spelarlista med search + tour-filter
- (app)/spelare/[slug] — spelarprofil
- (app)/turneringar — turneringskalender
- (app)/turneringar/[slug] — leaderboard
- (app)/feed — unified feed (nyheter + forum)
- (app)/onboarding — 3-stegs wizard (spelare, tourer, notiser)
- (app)/forum — forum per tour
- (app)/podcast — podcast-lista
- (app)/prenumerera — Stripe Checkout
- (app)/sammanfattning — AI-sammanfattningar
- (app)/statistik — statistik-dashboard

### Fas 3 — Infrastruktur ✅ KLAR (2026-06-07)
- Golf SQL migration: golf_players + golf_tournaments + golf_results (migration 013)
- isSupabaseConfigured() guard — bygg kraschar ej utan env vars
- force-dynamic på server-sidor (nyheter, sammanfattning)
- SEC: auth-krav på /api/push/route.ts (Clerk userId)
- sammanfattning.tsx: agent_reports → articles (rätt tabell)
- turbopack.root fix i next.config.ts
- RTK installerat

## Kritiska env-vars (blockerar live-data)
Se MANUAL.md för fullständig lista och hur man sätter dem.

## pnpm build
✅ Grön — 15 routes, 0 TypeScript-fel (2026-06-07)
