'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { validateNoContact } from '@/lib/contentFilter'

function formatTime(ts) {
  const d = new Date(ts)
  const isToday = d.toDateString() === new Date().toDateString()
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `heute ${time}`
  return `${d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} ${time}`
}

function formatPrice(cents) {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

const OFFER_STATUS = {
  pending:  { label: 'Offen',       cls: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Angenommen',  cls: 'bg-green-100 text-green-700'  },
  declined: { label: 'Abgelehnt',   cls: 'bg-gray-100 text-gray-500'    },
}

function OfferBubble({ msg, currentUserId, currentUserRole, actionLoading, onAccept, onDecline }) {
  const offer = msg.offer_data ?? {}
  const statusCfg = OFFER_STATUS[offer.status] ?? OFFER_STATUS.pending
  const isOwn = msg.sender_id === currentUserId
  const isProcessing = actionLoading === msg.id

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className="max-w-[85%] bg-white border-l-4 border-orange-400 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="font-semibold text-gray-900 text-sm">{offer.title}</p>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
        </div>
        {offer.description && (
          <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
        )}
        <div className="flex gap-4 text-sm">
          <span className="font-medium text-gray-900">{formatPrice(offer.price_cents)}</span>
          <span className="text-gray-500">{offer.date ? formatDate(offer.date) : ''}</span>
        </div>

        {offer.status === 'pending' && currentUserRole === 'customer' && (
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => onAccept(msg)}
              disabled={isProcessing}
              className="flex-1 bg-green-600 text-white rounded-lg py-1.5 text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
            >
              {isProcessing ? '…' : '✓ Annehmen'}
            </button>
            <button
              type="button"
              onClick={() => onDecline(msg)}
              disabled={isProcessing}
              className="flex-1 border border-gray-200 text-gray-500 rounded-lg py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              {isProcessing ? '…' : '✗ Ablehnen'}
            </button>
          </div>
        )}
      </div>
      <span className="text-[10px] text-gray-400 mt-0.5 px-1">{formatTime(msg.created_at)}</span>
    </div>
  )
}

export default function BookingChat({ bookingId, currentUserId, currentUserRole }) {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [offerModal, setOfferModal] = useState(false)
  const [offerForm, setOfferForm] = useState({ title: '', description: '', priceEuro: '', date: '' })
  const [offerSending, setOfferSending] = useState(false)
  const [offerError, setOfferError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    let active = true

    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at, message_type, offer_data, offer_booking_id')
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
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `booking_id=eq.${bookingId}`,
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [bookingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    const contactErr = validateNoContact(trimmed)
    if (contactErr) { setChatError(contactErr); return }
    setChatError(null)
    setSending(true)

    try {
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({
          booking_id:   bookingId,
          sender_id:    currentUserId,
          content:      trimmed,
          message_type: 'text',
        })
        .select('id, sender_id, content, created_at, message_type, offer_data, offer_booking_id')
        .single()

      if (error) {
        setChatError(error.message)
      } else if (newMsg) {
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
        setText('')
      }
    } finally {
      setSending(false)
    }
  }

  async function sendOffer() {
    const { title, description, priceEuro, date } = offerForm
    if (!title.trim() || !priceEuro || !date) {
      setOfferError('Bitte alle Pflichtfelder ausfüllen.')
      return
    }
    const price_cents = Math.round(parseFloat(priceEuro) * 100)
    if (isNaN(price_cents) || price_cents <= 0) {
      setOfferError('Ungültiger Preis.')
      return
    }
    setOfferSending(true)
    setOfferError(null)

    try {
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({
          booking_id:   bookingId,
          sender_id:    currentUserId,
          content:      'Ich habe dir ein Angebot geschickt.',
          message_type: 'offer',
          offer_data: {
            title:       title.trim(),
            description: description.trim() || null,
            price_cents,
            date,
            status:      'pending',
          },
        })
        .select('id, sender_id, content, created_at, message_type, offer_data, offer_booking_id')
        .single()

      if (error) {
        setOfferError(error.message)
      } else if (newMsg) {
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
        setOfferModal(false)
        setOfferForm({ title: '', description: '', priceEuro: '', date: '' })
      }
    } finally {
      setOfferSending(false)
    }
  }

  async function handleAccept(msg) {
    setActionLoading(msg.id)
    try {
      const res = await fetch('/api/bookings/from-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id, bookingId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setChatError(data.error ?? 'Fehler beim Annehmen des Angebots.')
        return
      }
      router.push(`/buchungen/${data.bookingId}/bezahlen`)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDecline(msg) {
    setActionLoading(msg.id)
    try {
      const { error } = await supabase
        .from('messages')
        .update({ offer_data: { ...msg.offer_data, status: 'declined' } })
        .eq('id', msg.id)
      if (error) {
        setChatError(error.message)
        return
      }
      setMessages(prev =>
        prev.map(m => m.id === msg.id
          ? { ...m, offer_data: { ...m.offer_data, status: 'declined' } }
          : m
        )
      )
    } finally {
      setActionLoading(null)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
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
          if (msg.message_type === 'offer') {
            return (
              <OfferBubble
                key={msg.id}
                msg={msg}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                actionLoading={actionLoading}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            )
          }
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
          {currentUserRole === 'provider' && (
            <button
              type="button"
              onClick={() => { setOfferModal(true); setOfferError(null) }}
              className="px-3 py-2.5 text-sm font-medium border border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 transition-colors shrink-0"
            >
              ＋ Angebot
            </button>
          )}
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

      {/* Angebot-Modal */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Angebot erstellen</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Titel *</label>
                <input
                  type="text"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="z.B. Hochzeitspaket Deluxe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Beschreibung</label>
                <textarea
                  rows={2}
                  value={offerForm.description}
                  onChange={(e) => setOfferForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                  placeholder="Optional …"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Preis (€) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={offerForm.priceEuro}
                  onChange={(e) => setOfferForm(f => ({ ...f, priceEuro: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Datum *</label>
                <input
                  type="date"
                  value={offerForm.date}
                  onChange={(e) => setOfferForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </div>
            {offerError && (
              <p className="text-red-500 text-xs mt-3">{offerError}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setOfferModal(false)}
                className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={sendOffer}
                disabled={offerSending}
                className="flex-1 btn-primary py-2 text-sm font-medium disabled:opacity-40"
              >
                {offerSending ? '…' : 'Angebot senden'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
