'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useUserPrefs } from '@/context/UserPrefsContext'

export default function NyTraadPage() {
  const { hasSetup } = useUserPrefs()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!title.trim() || !content.trim() || !hasSetup) return
    setSubmitting(true)
    setError('')

    // Skrivningen går via servern: identiteten sätts från Clerk-sessionen,
    // aldrig härifrån. Se app/api/forum/route.ts.
    const res = await fetch('/api/forum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), content: content.trim() }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: null }))
      setError(msg ?? 'Något gick fel. Försök igen.')
      setSubmitting(false)
      return
    }

    router.push('/forum')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/forum" className="inline-flex items-center gap-1.5 text-sm text-[#8A8070] hover:text-[#F5F0E8] mb-6">
        <ArrowLeft size={14} /> Forum
      </Link>

      <h1
        className="text-2xl font-semibold text-[#F5F0E8] mb-6"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        Ny tråd
      </h1>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#8A8070] mb-1.5 block">Titel</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Vad handlar tråden om?"
            className="w-full px-3 py-2.5 rounded-lg bg-[#111109] border border-[rgba(186,117,23,0.2)] text-sm text-[#F5F0E8] placeholder-[#5A5048] focus:outline-none focus:border-[rgba(186,117,23,0.5)]"
          />
        </div>

        <div>
          <label className="text-xs text-[#8A8070] mb-1.5 block">Innehåll</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Skriv ditt inlägg..."
            rows={6}
            className="w-full px-3 py-2.5 rounded-lg bg-[#111109] border border-[rgba(186,117,23,0.2)] text-sm text-[#F5F0E8] placeholder-[#5A5048] focus:outline-none focus:border-[rgba(186,117,23,0.5)] resize-none"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-3">
          <Link
            href="/forum"
            className="flex-1 py-3 rounded-full border border-[rgba(186,117,23,0.3)] text-[#8A8070] text-sm text-center hover:text-[#F5F0E8] transition-colors"
          >
            Avbryt
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !content.trim() || !hasSetup}
            className="flex-1 py-3 rounded-full bg-[#BA7517] text-[#0A0A08] text-sm font-medium hover:bg-[#EF9F27] disabled:opacity-40 transition-colors"
          >
            {submitting ? 'Publicerar...' : 'Publicera'}
          </button>
        </div>
      </div>
    </div>
  )
}
