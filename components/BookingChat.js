'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Fängt E-Mails (@), URLs (http/www), tel:-Schema und Telefonnummern-Muster
const CONTACT_RE = /@|https?:\/\/|www\.|tel:|mailto:|\d{7,}|\+\d[\d\s]{8,}|\b0\d[\d\s\-\/]{5,}/i

function formatTime(ts) {
  const d = new Date(ts)
  const isToday = d.toDateString() === new Date().toDateString()
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `heute ${time}`
  return `${d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} ${time}`
}

export default function BookingChat({ bookingId, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    let active = true

    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true })
      if (active) setMessages(data ?? [])
    }
    loadMessages()

    const channel = supabase
      .channel(`booking-chat-${bookingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `booking_id=eq.${bookingId}`,
      }, (payload) => {
        setMessages(prev =>
          prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]
        )
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [bookingId])

  // Auto-Scroll bei neuen Nachrichten
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    if (CONTACT_RE.test(trimmed)) {
      setChatError('Bitte teile keine Kontaktdaten. Nutze Festly für die gesamte Kommunikation.')
      return
    }
    setChatError(null)
    setSending(true)

    const { data: newMsg, error } = await supabase
      .from('messages')
      .insert({ booking_id: bookingId, sender_id: currentUserId, content: trimmed })
      .select('id, sender_id, content, created_at')
      .single()

    setSending(false)
    if (error) {
      setChatError(error.message)
    } else if (newMsg) {
      // Optimistisch hinzufügen; Realtime-Event wird dedupliziert
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
      setText('')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col border-t border-gray-100">

      {/* Hinweis-Banner */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-start gap-2">
        <span className="shrink-0 text-sm">💬</span>
        <p className="text-xs text-amber-700 leading-relaxed">
          Tauscht keine Telefonnummern oder E-Mail-Adressen aus. Die Kommunikation läuft über Festly.
        </p>
      </div>

      {/* Nachrichten-Liste */}
      <div className="h-60 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/40">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 pt-6">
            Noch keine Nachrichten — schreib als Erstes!
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                  isOwn
                    ? 'text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                }`}
                style={isOwn ? { background: 'linear-gradient(to right, #C026A0, #7C3AED)' } : {}}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                {formatTime(msg.created_at)}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Eingabe */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        {chatError && (
          <p className="text-red-500 text-xs mb-2 leading-snug">{chatError}</p>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              rows={1}
              maxLength={1000}
              value={text}
              onChange={(e) => { setText(e.target.value); if (chatError) setChatError(null) }}
              onKeyDown={handleKeyDown}
              placeholder="Nachricht … (Enter zum Senden)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent resize-none"
            />
            {text.length > 800 && (
              <span className="absolute bottom-2.5 right-2 text-[10px] text-gray-400 pointer-events-none">
                {text.length}/1000
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !text.trim()}
            className="btn-primary px-3.5 py-2.5 text-sm font-bold disabled:opacity-40 shrink-0"
          >
            ↑
          </button>
        </div>
      </div>

    </div>
  )
}
