'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { useUserPrefs } from '@/context/UserPrefsContext'
import { supabase } from '@/lib/supabase'

interface Thread {
  id: string
  title: string
  content: string
  author_name: string
  created_at: string
}

interface Reply {
  id: string
  content: string
  author_name: string
  created_at: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return `${Math.floor(diff / 60000)} min sedan`
  if (h < 24) return `${h}h sedan`
  return `${Math.floor(h / 24)}d sedan`
}

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const { hasSetup } = useUserPrefs()
  const [thread, setThread] = useState<Thread | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: r }] = await Promise.all([
        supabase.from('forum_threads').select('*').eq('id', threadId).single(),
        supabase.from('forum_replies').select('*').eq('thread_id', threadId).order('created_at'),
      ])
      setThread(t)
      setReplies(r ?? [])
      setLoading(false)
    }
    load()
  }, [threadId])

  async function handleReply() {
    if (!reply.trim() || !hasSetup) return
    setSubmitting(true)

    // Serverväg — identiteten sätts från Clerk-sessionen. Se app/api/forum/route.ts.
    const res = await fetch('/api/forum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'reply', threadId, content: reply.trim() }),
    })
    if (!res.ok) {
      setSubmitting(false)
      return
    }

    const { data } = await supabase
      .from('forum_replies')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at')
    setReplies(data ?? [])
    setReply('')
    setSubmitting(false)
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-6"><div className="h-40 rounded-xl bg-[#111109] animate-pulse" /></div>
  }

  if (!thread) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-[#8A8070]">Tråden hittades inte.</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href="/forum" className="inline-flex items-center gap-1.5 text-sm text-[#8A8070] hover:text-[#F5F0E8] mb-6">
        <ArrowLeft size={14} /> Forum
      </Link>

      <div className="p-4 rounded-xl bg-[#111109] border border-[rgba(186,117,23,0.15)] mb-6">
        <h1 className="text-xl font-semibold text-[#F5F0E8] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {thread.title}
        </h1>
        <p className="text-sm text-[#C8BFA8] leading-relaxed mb-3">{thread.content}</p>
        <div className="flex items-center gap-2 text-xs text-[#5A5048]">
          <span>{thread.author_name}</span>
          <span>·</span>
          <span>{timeAgo(thread.created_at)}</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {replies.map((r) => (
          <div key={r.id} className="p-3 rounded-lg bg-[#111109] border border-[rgba(186,117,23,0.08)]">
            <p className="text-sm text-[#C8BFA8] mb-2">{r.content}</p>
            <div className="flex items-center gap-2 text-xs text-[#5A5048]">
              <span>{r.author_name}</span>
              <span>·</span>
              <span>{timeAgo(r.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {hasSetup ? (
        <div className="flex gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Skriv ett svar..."
            rows={3}
            className="flex-1 px-3 py-2 rounded-lg bg-[#111109] border border-[rgba(186,117,23,0.2)] text-sm text-[#F5F0E8] placeholder-[#5A5048] focus:outline-none focus:border-[rgba(186,117,23,0.5)] resize-none"
          />
          <button
            onClick={handleReply}
            disabled={submitting || !reply.trim()}
            className="self-end p-2.5 rounded-lg bg-[#BA7517] text-[#0A0A08] hover:bg-[#EF9F27] disabled:opacity-40 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-[#8A8070]">
          <Link href="/onboarding" className="text-[#BA7517] hover:text-[#EF9F27]">Välj din spelare</Link> för att svara.
        </div>
      )}
    </div>
  )
}
