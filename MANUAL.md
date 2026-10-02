# MANUAL.md — Nano Fotboll Golf (manuella steg)
> Uppdaterad: 2026-06-07

## Måste göras för att golf.nanofotboll.se ska gå live

### 1. Kör SQL-migration i Supabase
Öppna https://supabase.com/dashboard → fmwjmrtqvdxswlimroqx → SQL Editor
Klistra in och kör: `nano-os/supabase/migrations/20260606000013_golf_tables.sql`

### 2. Lägg till golf RSS-källor
```
cd nano-os
pnpm tsx scripts/add-golf-rss-sources.ts
```

### 3. Sätt env vars i Vercel för nano-golf
Gå till Vercel dashboard → nano-golf projekt → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://fmwjmrtqvdxswlimroqx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<från Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<från Supabase dashboard>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<från Clerk dashboard>
CLERK_SECRET_KEY=<från Clerk dashboard>
ANTHROPIC_API_KEY=<från Anthropic console>
STRIPE_SECRET_KEY=<från Stripe dashboard>
STRIPE_WEBHOOK_SECRET=<från Stripe webhooks>
NEXT_PUBLIC_BASE_URL=https://golf.nanofotboll.se
```

### 4. Koppla nano-golf till Vercel
```
cd nano-golf
vercel link
vercel --prod
```
Sedan i Vercel: Settings → Domains → Lägg till golf.nanofotboll.se

### 5. Generera VAPID-nycklar (push-notiser)
```
npx web-push generate-vapid-keys
```
Sätt i Vercel för **nano-fotboll**, **nano-admin** och **nano-golf**:
```
VAPID_PUBLIC_KEY=<output från kommandot>
VAPID_PRIVATE_KEY=<output från kommandot>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<samma som VAPID_PUBLIC_KEY>
```

### 6. Sätt ANTHROPIC_API_KEY i Vercel för web + admin
Gå till nano-fotboll och nano-admin i Vercel → Environment Variables → lägg till ANTHROPIC_API_KEY

### 7. Verifiera Clerk webhook i produktion
Clerk Dashboard → Webhooks → Lägg till endpoint: https://golf.nanofotboll.se/api/webhooks/clerk
