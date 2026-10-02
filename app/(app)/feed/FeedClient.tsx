'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Newspaper, MessageSquare, Brain, Loader2, RefreshCw } from 'lucide-react'
import type { FeedItem } from '@/types/golf'

const PAGE_SIZE = 30

const TYPE_META = {
  news:    { label: 'Nyhet',     color: '#BA7517', icon: Newspaper },
  forum:   { label: 'Forum',     color: '#7F77DD', icon: MessageSquare },
  summary: { label: 'AI-analys', color: '#BA7517', icon: Brain },
  podcast: { label: 'Podcast',   color: '#378ADD', icon: Newspaper },
} as const

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just nu'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function FeedCard({ item }: { item: FeedItem }) {
  const meta = TYPE_META[item.type as keyof typeof TYPE_META] ?? TYPE_META.news
  const Icon = meta.icon

  return (
    <div
      className="flex items-start gap-3 rounded-xl p-4 transition-colors cursor-pointer"
      style={{
        background: '#111109',
        border: '1px solid rgba(186,117,23,0.15)',
        borderLeftWidth: 3,
        borderLeftColor: meta.color,
      }}
    >
      <div
        className="mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: meta.color + '20' }}
      >
        <Icon className="w-4 h-4" style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-[11px]" style={{ color: '#8A8070' }}>{timeAgo(item.created_at)}</span>
          {item.source && (
            <>
              <span className="text-[11px]" style={{ color: '#5A5048' }}>·</span>
              <span className="text-[11px] truncate" style={{ color: '#8A8070' }}>{item.source}</span>
            </>
          )}
        </div>
        <p className="text-sm font-medium line-clamp-2" style={{ color: '#F5F0E8' }}>{item.title}</p>
        {item.excerpt && (
          <p className="text-xs line-clamp-1 mt-0.5" style={{ color: '#8A8070' }}>{item.excerpt}</p>
        )}
      </div>
    </div>
  )
}

export function FeedClient() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [newCount, setNewCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset
    if (reset) setLoading(true)
    else setLoadingMore(true)

    try {
      const res = await fetch(`/api/feed?sport=golf&limit=${PAGE_SIZE}&offset=${currentOffset}`)
      const data: FeedItem[] = res.ok ? await res.json() : []

      if (reset) {
        setItems(data)
        setOffset(data.length)
        setNewCount(0)
      } else {
        setItems((prev) => {
          const ids = new Set(prev.map((i) => i.id))
          return [...prev, ...data.filter((i) => !ids.has(i.id))]
        })
        setOffset((o) => o + data.length)
      }
      setHasMore(data.length === PAGE_SIZE)
    } catch {
      // nätverksfel — visa vad vi har
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [offset])

  useEffect(() => {
    // ponytail: fire-and-forget async load; not a synchronous setState-in-effect
    const timer = setTimeout(() => void load(true), 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!bottomRef.current || loadingMore || !hasMore) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) void load() },
      { threshold: 0.1 }
    )
    obs.observe(bottomRef.current)
    return () => obs.disconnect()
  }, [loadingMore, hasMore, load])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#F5F0E8' }}>
            GOLF FEED
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A8070' }}>Nyheter, analyser & forum</p>
        </div>
        {newCount > 0 && (
          <button
            onClick={() => void load(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{ background: 'rgba(186,117,23,0.15)', color: '#BA7517', border: '1px solid rgba(186,117,23,0.3)' }}
          >
            <RefreshCw className="w-3 h-3" />
            {newCount} ny{newCount > 1 ? 'a' : ''}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#111109', border: '1px solid rgba(186,117,23,0.1)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20" style={{ color: '#8A8070' }}>
          <p className="text-sm">Inga artiklar i feeden ännu.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => <FeedCard key={item.id} item={item} />)}
        </div>
      )}

      <div ref={bottomRef} className="h-4" />

      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#8A8070' }} />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-xs py-4" style={{ color: '#5A5048' }}>Inga fler artiklar</p>
      )}
    </div>
  )
}
