/**
 * app/api/forum/route.ts — serverväg för forumskrivningar (golf)
 * ─────────────────────────────────────────────────────────────────────────────
 * Skrivningarna låg tidigare i klientkomponenterna och gick direkt mot Supabase
 * med den PUBLIKA anon-nyckeln, med `author_id` hämtat från localStorage. Två
 * problem: identiteten var helt spoofbar (vem som helst kunde posta som vem som
 * helst), och vägen förutsatte INSERT-grant till anon — en grant som stängdes i
 * säkerhetslåset 2026-08-06 och som inte ska öppnas igen.
 *
 * Nu: Clerk-session krävs, `author_id` kommer från sessionen och aldrig från
 * bodyn, och skrivningen sker med service_role server-side. Samma mönster som
 * app/api/push/route.ts i det här repot och som athopia-webs forum-routes.
 *
 * Produktändring att vara medveten om: att POSTA kräver nu inloggning. Att LÄSA
 * forumet är fortsatt öppet. Merparten av appen (feed, spelare, statistik) ligger
 * redan bakom Clerk enligt proxy.ts, så en besökare som når forumet är i praktiken
 * redan inloggad.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin, isSupabaseConfigured, SPORT } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const MAX_TITLE = 200
const MAX_CONTENT = 5000

/** Enkel per-användare-broms mot spam. Best-effort per instans. */
const lastPost = new Map<string, number>()
const MIN_INTERVAL_MS = 5000

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Inloggning krävs' }, { status: 401 })
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase ej konfigurerat' }, { status: 503 })
  }

  const now = Date.now()
  const previous = lastPost.get(userId)
  if (previous && now - previous < MIN_INTERVAL_MS) {
    return NextResponse.json({ error: 'Vänta en stund innan nästa inlägg' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ogiltig body' }, { status: 400 })
  }

  const { kind, title, content, threadId } = (body ?? {}) as {
    kind?: string
    title?: string
    content?: string
    threadId?: string
  }

  const text = typeof content === 'string' ? content.trim() : ''
  if (!text || text.length > MAX_CONTENT) {
    return NextResponse.json({ error: 'Innehåll saknas eller är för långt' }, { status: 400 })
  }

  // Visningsnamnet får komma från Clerk — aldrig från klientens body.
  const user = await currentUser()
  const authorName =
    user?.username ?? user?.firstName ?? user?.emailAddresses[0]?.emailAddress?.split('@')[0] ?? 'Anonym'

  if (kind === 'reply') {
    if (!threadId) return NextResponse.json({ error: 'threadId krävs' }, { status: 400 })
    const { error } = await supabaseAdmin.from('forum_replies').insert({
      thread_id: threadId,
      content: text,
      author_id: userId,
      author_name: authorName,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    lastPost.set(userId, now)
    return NextResponse.json({ ok: true })
  }

  const heading = typeof title === 'string' ? title.trim() : ''
  if (!heading || heading.length > MAX_TITLE) {
    return NextResponse.json({ error: 'Titel saknas eller är för lång' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('forum_threads')
    .insert({
      title: heading,
      content: text,
      author_id: userId,
      author_name: authorName,
      sport: SPORT,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  lastPost.set(userId, now)
  return NextResponse.json({ ok: true, id: data?.id })
}
